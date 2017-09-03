<?php

/**
 * Class CameraRaw
 */
class CameraRaw
{
    /**
     * @var array an array containing popular raw file format extensions
     */
    private static $rawExtensions = array('.ari','.arw','.bay','.crw','.cr2','.cap','.dcs','.dcr','.dng','.drf','.eip','.erf','.fff','.iiq','.k25','.kdc','.mdc','.mef','.mos','.mrw','.nef','.nrw','.obm','.orf','.pef','.ptx','.pxn','.r3d','.raf','.raw','.rwl','.rw2','.rwz','.sr2','.srf','.srw', '.x3f');

    /**
     * Checks if a file exists based on the filepath.
     *
     * @param string $filePath the path to the file
     *
     * @return bool returns true if the file exists
     */
    private static function checkFile($filePath)
    {
        if (file_exists($filePath)) {
            return true;
        }
        return false;
    }

    /**
     * Checks if a file is a raw file based on file extension.
     *
     * @param string $filePath the path to the file
     *
     * @return bool returns true if the file is a raw type
     */
    public static function isRawFile($filePath)
    {
        $fileExtension = '.'.pathinfo($filePath, PATHINFO_EXTENSION);
        if (in_array(strToLower($fileExtension), self::$rawExtensions)) {
            return true;
        }
        return false;
    }

    /**
     * Fetches all preview types that are embedded in an image.
     *
     * @param string $filePath the path to the file
     *
     * @return array all the detected previews.
     */
    public static function embeddedPreviews($filePath)
    {
        if (!self::checkFile($filePath)) {
            throw new \InvalidArgumentException('Incorrect filepath given');
        }
        $previewOutput = self::exec('exiv2 -pp "'.$filePath.'"');

        return $previewOutput ? explode(PHP_EOL, $previewOutput) : [];
    }

    /**
     * Generates a new jpg image with new sizes from an already existing file.
     * (This will also work on raw files, but it will be exceptionally
     * slower than extracting the preview).
     *
     * @param string $sourceFilePath the path to the original file
     * @param int    $width          the max width
     * @param int    $height         the max height of the image
     * @param int    $quality        the quality of the new image (0-100)
     * @param string $format         the format of image (jpg)
     *
     * @return string
     * @throws \InvalidArgumentException
     */
    public static function generateImage(string $source, int $width, int $height, int $quality = 60, string $format = 'jpg')
    {
        $im = new \Imagick();
        $im->readImageBlob($source);
        $im->setImageFormat($format);
        $im->setImageCompressionQuality($quality);
        $im->stripImage();
        $im->thumbnailImage($width, $height, true);

        return $im->getImageBlob();
    }

    /**
     * Extracts a preview image from an image and saves the
     * image to the designated path.
     *
     * @param string $sourceFilePath the path to the original file
     * @param string $targetFilePath the path to the new file
     * @param int    $previewNumber  which preview (defaults to the highest preview)
     *
     * @return string
     *
     * @throws \InvalidArgumentException
     * @throws \Exception
     */
    public static function extractPreview(string $sourceFilePath, int $previewNumber = null, int $minWidth = null, int $minHeight = null, string $targetFilePath = null)
    {
        $cleanFiles = [];

        // check that the source file exists.
        if (!self::checkFile($sourceFilePath)) {
            throw new \InvalidArgumentException('Incorrect source filepath given '.$sourceFilePath);
        }

        // fetch the all the preview images (and verify that there indeed exit previews)
        $previews = self::embeddedPreviews($sourceFilePath);

        // filter previews to make sure we have the min width and min height
        $validPreviewCount = count($previews);
        if (!empty($minWidth) || !empty($minHeight)) {
            foreach ($previews as $i => $previewInfo) {
                $matches = [];
                if (preg_match('/(?<width>\d+)x(?<height>\d+) pixels/', $previewInfo, $matches)
                    && ($matches['width'] < $minWidth || $matches['height'] < $minHeight)
                ) {
                    $validPreviewCount--;
                }
            }
        }

        $filename = pathinfo($sourceFilePath, PATHINFO_FILENAME);
        if ($validPreviewCount == 0 || empty($minWidth) || empty($minHeight)) {
            $filePath = $sourceFilePath;
        } else {
            // default to the last preview
            if (is_null($previewNumber)) {
                $previewNumber = count($previews);
            }
            $previewNumber = intval($previewNumber);

            // generate the preview with exiv2, save it to the temp directory
            self::exec('exiv2 -fep'.$previewNumber.' -l '.sys_get_temp_dir().' "'.$sourceFilePath.'"');

            $previewFilePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename . '-preview' . $previewNumber . '.jpg';
            // check that the preview got saved correctly
            if (!self::checkFile($previewFilePath)) {
                throw new \Exception("No preview file for {$sourceFilePath}");
            }

            // copy the preview to the target path and remove the original one in temp
            if (!is_null($targetFilePath)) {
                //$targetFilePath = $filename . '.jpg';
                copy($previewFilePath, $targetFilePath);
            }

            $filePath = $previewFilePath;
            $cleanFiles[] = $previewFilePath;
        }

        // auto rotate
        $orientation = self::getOrientation($sourceFilePath);
        if ($orientation) {
            $rotatedFilePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename . '-rotated.jpg';

            $angle = 0;
            switch ($orientation) {
                case \Imagick::ORIENTATION_RIGHTTOP:
                //case \Imagick::ORIENTATION_TOPRIGHT:
                    $angle = 90;
                    break;

                //case \Imagick::ORIENTATION_RIGHTBOTTOM:
                case \Imagick::ORIENTATION_BOTTOMRIGHT:
                    $angle = 180;
                    break;

                case \Imagick::ORIENTATION_LEFTBOTTOM:
                //case \Imagick::ORIENTATION_TOPLEFT:
                    $angle = 270;
                    break;
            }

            if ($angle) {
                self::exec('convert "' . $filePath . '" -quality 100 -rotate ' . $angle . ' '  . $rotatedFilePath);

                $filePath = $rotatedFilePath;
                $cleanFiles[] = $rotatedFilePath;
            }
        }
        $content = file_get_contents($filePath);

        foreach ($cleanFiles as $filePath) {
            unlink($filePath);
        }

        return $content;
    }

    /**
     * @param string $sourceFilePath
     * @return int
     */
    public static function getOrientation(string $sourceFilePath) {
        $matches = [];
        try {
            $output = self::exec('exiv2 pr -p t "' . $sourceFilePath . '" |grep Orientation');
        } catch (\Exception $e) {
            // allow images without exif info to pass this point
            $output = '';
        }
        preg_match("/(left|right|top|bottom),\x20(left|right|top|bottom)/i", $output, $matches);
        //var_dump($sourceFilePath, $output, $matches);die();
        $orientation = \Imagick::ORIENTATION_UNDEFINED;

        if (!empty($matches)) {
            switch(strtolower($matches[0])) {
                case 'right, top':
                    $orientation = \Imagick::ORIENTATION_RIGHTTOP;
                    break;

                case 'top, right':
                    $orientation = \Imagick::ORIENTATION_TOPRIGHT;
                    break;

                case 'top, left':
                    $orientation = \Imagick::ORIENTATION_TOPLEFT;
                    break;

                case 'right, bottom':
                    $orientation = \Imagick::ORIENTATION_RIGHTBOTTOM;
                    break;

                case 'bottom, right':
                    $orientation = \Imagick::ORIENTATION_BOTTOMRIGHT;
                    break;

                case 'left, bottom':
                    $orientation = \Imagick::ORIENTATION_LEFTBOTTOM;
                    break;

                case 'bottom, left':
                    $orientation = \Imagick::ORIENTATION_BOTTOMLEFT;
                    break;
            }
        }

        return $orientation;
    }

    /**
     * @param string $command
     * @return string
     */
    private static function exec(string $command)
    {
        //echo $command . "<br/>" . PHP_EOL;
        $output = array();
        //$return = null;
        exec($command, $output, $return);
        if ($return) {
            throw new RuntimeException("Could not execute '{$command}'. Output was: '" . implode(PHP_EOL, $output) . "'. Return code was {$return}");
        }

        return implode(PHP_EOL, $output);
    }

}
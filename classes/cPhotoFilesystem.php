<?php

class cPhotoFilesystem  extends cPhotoAbstractEngine
{
    public function getAll(): array
    {
        $m = new Cache();

        $cacheKey = sys_get_temp_dir() . DIRECTORY_SEPARATOR .  'photo_' . md5($this->path) . '.log';
        $arr = $m->get($cacheKey);
        if ($arr === false) {
            $Directory = new RecursiveDirectoryIterator($this->path, \FilesystemIterator::FOLLOW_SYMLINKS);
            $Iterator = new RecursiveIteratorIterator($Directory);
            $filter = new RegexIterator($Iterator, '/^.+\.(nef|jpg)$/i', RecursiveRegexIterator::GET_MATCH);
            $arr = array_keys(iterator_to_array($filter));
            $m->set($cacheKey, $arr, 60 * 60 * 24);
        }

        return $arr;
    }

    public function getById(int $photoId): string
    {
        $arr = $this->getAll();
        if (!isset($arr[$photoId])) {
            throw new \InvalidArgumentException("Invalid photo id `{$photoId}``");
        }

        return $arr[$photoId];
    }

    /**
     * @param int $count
     * @param string $size
     * @return cPhoto[]
     */
    public function getRandomPhoto(int $count = 10, string $size="S"): array
    {
        $arr = $this->getAll();

        $photoPaths = [];
        foreach ((array)array_rand($arr, $count) as $i) {
            $photoPaths[] = $this->transform($i, $size);
        }

        return $photoPaths;
    }
}

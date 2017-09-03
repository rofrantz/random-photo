<?php

/**
 * Class cPhoto
 */
class cPhoto
{
    /** @var int */
    protected $id;

    /** @var string */
    protected $pathPrefix;

    /** @var string */
    protected $fullPath;

    /** @var string */
    protected $name;

    /** @var DateTime */
    protected $date;

    /** @var string */
    protected $content;

    /**
     * cPhoto constructor.
     * @param $fullPath
     * @param $pathPrefix
     */
    public function __construct($fullPath, $pathPrefix)
    {
        $this->pathPrefix = realpath($pathPrefix)  . DIRECTORY_SEPARATOR;
        $this->fullPath = realpath($fullPath);
        $this->name = trim(preg_replace(
            ["/" . str_replace("/", "\/", $this->pathPrefix) . "|\/" . basename($this->fullPath) . "|\/@eaDir\/.*/", "/\//","/^'(.*)'$/"],
            ['', ' - ', '$1'],
            $this->fullPath
        ));

        $matches = [];
        if (preg_match('/^(?<year>\d{4})_(?<month>\d{2})_(?<day>\d{2})/', $this->name, $matches)) {
            $this->name = preg_replace("/" . $matches[0] . "\s{0,}\-\s{0,}/", "", $this->name);
            $this->date = new DateTime("{$matches['year']}-{$matches['month']}-{$matches['day']}");
        } elseif (preg_match('/(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})_/', $this->fullPath, $matches)) {
            $this->date = new DateTime("{$matches['year']}-{$matches['month']}-{$matches['day']}");
        }

        //die($fullPath . PHP_EOL. $this->name.PHP_EOL);
    }

    /**
     * @return int
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * @param int $id
     * @return cPhoto
     */
    public function setId(int $id): cPhoto
    {
        $this->id = $id;
        return $this;
    }

    /**
     * @return string
     */
    public function getPath()
    {
        return preg_replace(
            ["/" . str_replace("/", "\/", $this->pathPrefix) . "|\/@eaDir/", "/\/SYNO(.*)$/"],
            [''],
            $this->fullPath
        );
    }

    /**
     * @return string
     */
    public function getFullPath()
    {
        return $this->fullPath;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return string
     */
    public function getContent(): string
    {
        return $this->content;
    }

    /**
     * @param string $content
     * @return cPhoto
     */
    public function setContent(string $content): cPhoto
    {
        $this->content = $content;
        return $this;
    }

}

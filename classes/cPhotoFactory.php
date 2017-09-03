<?php

class cPhotoFactory
{
    public static function create(string $engine, array $options = []): cPhotoAbstractEngine
    {
        switch (strtolower($engine)) {
            case 'filesystem':
                $instance = new cPhotoFilesystem($options);
                break;

            default:
                throw new InvalidArgumentException("Unhandled engine {$engine}");
        }

        return $instance;
    }
}

<?php

/**
 * Class cPostgreDb
 */
class cPostgreDb {

    public static function execute($sql)
    {
        $cmd = 'psql -d mediaserver -tA -c "' . $sql . '"';
		exec($cmd, $output, $ret);
        return $output;
    }
}

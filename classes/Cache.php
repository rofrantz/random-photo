<?php

/**
 * Class Cache
 */
class Cache
{
    public function set(string $key, $value, $ttl = 0) {
        file_put_contents($key, serialize(['ttl' => $ttl, 'value' => $value]));
    }

    /**
     * @param string $key
     * @return string|boolean
     */
    public function get(string $key) {
        $value = false;
        $content = @file_get_contents($key);
        if ($content) {
            $var = unserialize($content);
            $modified = filemtime($key);
            if ($modified + $var['ttl'] > strtotime('now')) {
                $value = $var['value'];
            }
        }

        return $value;
    }
}

<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // allow requests from your extension

$file = "../data/wordColors.json";

// If the file does not exist, return empty object
if (!file_exists($file)) {
    echo json_encode(new stdClass());
    exit;
}

$data = file_get_contents($file);
if (!$data) {
    echo json_encode(new stdClass());
    exit;
}

$colors = json_decode($data, true);
if (!$colors) $colors = [];

echo json_encode($colors);

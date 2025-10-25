<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$file = "../data/wordNotes.json";

// If the file does not exist, create empty file and return {}
if (!file_exists($file)) {
    file_put_contents($file, json_encode(new stdClass()));
    echo json_encode(new stdClass());
    exit;
}

$data = file_get_contents($file);
if (!$data) {
    echo json_encode(new stdClass());
    exit;
}

$notes = json_decode($data, true);
if (!$notes) $notes = [];

echo json_encode($notes);

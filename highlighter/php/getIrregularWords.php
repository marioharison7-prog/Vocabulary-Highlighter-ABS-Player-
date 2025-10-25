<?php
// getIrregularWords.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // allow requests from your extension

// Path to the JSON file
$file = '../data/irregularWords.json';

// Check if file exists
if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

// Read and output JSON content
$data = file_get_contents($file);
echo $data;
 
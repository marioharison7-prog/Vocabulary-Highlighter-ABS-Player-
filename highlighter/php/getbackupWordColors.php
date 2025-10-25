<?php
header('Content-Type: application/json');

// Allow requests from your extension or localhost (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

// Path to the JSON file
$filePath = '../data/wordColors.json';

// Return the word colors
if (file_exists($filePath)) {
    $jsonData = file_get_contents($filePath);
    $wordColors = json_decode($jsonData, true);
    echo json_encode(["wordColors" => $wordColors ?? []]);
} else {
    // Return empty object if file doesn't exist
    echo json_encode(["wordColors" => []]);
}
?>
 
<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Path to JSON file
$file = '../data/wordColors.json';

// Get raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['word']) || !isset($data['color'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing word or color']);
    exit;
}

$word = trim($data['word']);
$color = trim($data['color']);

// Load existing JSON or initialize empty
if (file_exists($file)) {
    $colors = json_decode(file_get_contents($file), true);
    if (!is_array($colors)) $colors = [];
} else {
    $colors = [];
}

// Update word color
$colors[$word] = $color;

// Save back to file
if (file_put_contents($file, json_encode($colors, JSON_PRETTY_PRINT))) {
    echo json_encode(['status' => 'success', 'word' => $word, 'color' => $color]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save']);
}
?>

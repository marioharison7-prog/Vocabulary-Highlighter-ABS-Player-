<?php
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json");

$file = "../data/definitions.json";
if (!file_exists($file)) { 
    file_put_contents($file, "{}"); 
}

$definitions = json_decode(file_get_contents($file), true);

// Normalize output: each word has definition, color, and time
$result = [];
foreach ($definitions as $word => $info) {
    $result[$word] = [
        "definition" => isset($info["definition"]) && $info["definition"] !== "undefined" ? $info["definition"] : "",
        "color"      => $info["color"] ?? "#000000",
        "time"       => $info["time"] ?? date("c")
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

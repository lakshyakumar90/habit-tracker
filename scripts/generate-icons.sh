#!/bin/bash
# scripts/generate-icons.sh
# Requires: ImageMagick

set -e

SOURCE="assets/images/icon-source.png"
OUT="assets/images"

echo "Generating app icons..."

magick "$SOURCE" -resize 1024x1024 "$OUT/icon.png"
magick "$SOURCE" -resize 660x660 -gravity center -background none -extent 1024x1024 "$OUT/android-icon-foreground.png"
magick "$SOURCE" -resize 1024x1024 "$OUT/android-icon-background.png"
magick "$SOURCE" -resize 660x660 -gravity center -background none -extent 1024x1024 -colorspace Gray -threshold 50% -negate -background none -alpha shape "$OUT/android-icon-monochrome.png"
magick "$SOURCE" -resize 512x512 "$OUT/splash-icon.png"
magick "$SOURCE" -resize 48x48 "$OUT/favicon.png"

echo "Done. Icons generated in $OUT"

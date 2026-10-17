#!/bin/sh
# usage: scripts/sheet.sh <dir> <out.png> [cols=4] [tileW=500]   tiles every f*.png in <dir>
dir=$1; out=$2; cols=${3:-4}; tw=${4:-500}
files=$(ls $dir/f*.png); n=$(echo "$files" | wc -l); args=""; fc=""; i=0
for f in $files; do args="$args -i $f"; fc="$fc[$i:v]scale=$tw:-1[s$i];"; i=$((i+1)); done
th=$((tw*1920/1080)); lay=""; i=0
while [ $i -lt $n ]; do x=$(( (i%cols)*tw )); y=$(( (i/cols)*th )); lay="$lay${lay:+|}${x}_${y}"; i=$((i+1)); done
ins=""; i=0; while [ $i -lt $n ]; do ins="$ins[s$i]"; i=$((i+1)); done
ffmpeg -y -v error $args -filter_complex "${fc}${ins}xstack=inputs=$n:layout=$lay" -frames:v 1 $out

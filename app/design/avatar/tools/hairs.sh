#!/bin/zsh
# render every hairstyle front + 3/4 + back on the head
M=$HOME/Downloads/Model; T=${OUT:-/tmp/avatar-scout}; mkdir -p $T/hair; : > $T/hairrender.tsv
B="$M/PlayerBody.Nin_NX_NVN/PlayerBody.dae:skip=Nose01__mNose,Nose02__mNose:tint=mSkin=#f3c7a0,mPaint=#f3c7a0,mEye=#f3c7a0,mMouth=#f3c7a0,mCheek=#f3c7a0:tex=mPaint=/x,mEye=/x,mMouth=/x,mCheek=/x"
for i in $(seq -w 0 36); do
  d=$M/PlayerHair$i.Nin_NX_NVN; [ -d $d ] || continue
  for yaw in 0 35 180; do
    CULL=-1 PAD=1.25 uv run -q --no-project --with pillow --with numpy python -I /Users/waylonhuang/Documents/other/fitness/.claude/worktrees/avatar-explore/app/design/avatar/tools/render.py $T/hair/h${i}_$yaw.png 220 $yaw "$B" "$d/PlayerHair$i.dae:tint=mHair=#4a2e1e,mHairSkin=#f3c7a0:off=0,8.957,-0.39:frame=1:cull=-1" &
  done; wait
  for yaw in 0 35 180; do printf "PlayerHair$i yaw$yaw\t$T/hair/h${i}_$yaw.png\n" >> $T/hairrender.tsv; done
done

#!/bin/zsh
# outfit.sh out.png yaw hair hairtint top topshape bottom bottomshape shoes socks glasses eye mouthframe
M=$HOME/Downloads/Model; T=${OUT:-/tmp/avatar-scout}
out=$1 yaw=$2 hair=$3 ht=$4 top=$5 tshape=$6 bot=$7 bshape=$8 shoes=$9 socks=${10} glass=${11} eye=${12:-PlayerEye02} mouth=${13:-PlayerMouth01/mMouth_Alb.0}
SK='#f6cfa8'
args=("$M/PlayerBody.Nin_NX_NVN/PlayerBody.dae:skip=Nose01__mNose,Nose02__mNose:tint=mSkin=${SK},mPaint=${SK},mCheek=${SK},mEye=${SK},mMouth=${SK}:tex=mPaint=/x,mEye=/x,mCheek=/x,mMouth=/x,mSocks=$M/${socks}.Nin_NX_NVN/mSocks_Alb.png")
args+=("$M/$hair.Nin_NX_NVN/$hair.dae:tint=mHair=${ht},mHairSkin=${SK}:off=0,8.957,-0.39:cull=-1")
[ -n "$top" ] && args+=("$M/$tshape.Nin_NX_NVN/$tshape.dae:tex=mTops=$M/${top}.Nin_NX_NVN/mTops_Alb.png:cull=-1")
[ -n "$bot" ] && args+=("$M/$bshape.Nin_NX_NVN/$bshape.dae:tex=mBottoms=$M/${bot}.Nin_NX_NVN/mBottoms_Alb.png:skip=Body__mSoftmesh:cull=-1")
[ -n "$shoes" ] && args+=("$M/$shoes.Nin_NX_NVN/$shoes.dae")
[ -n "$glass" ] && args+=("$M/$glass.Nin_NX_NVN/$glass.dae:off=${GOFF:-0,11.2,2.45}:skip=AccessoryAlpha1__mAccessoryAlpha")
PAD=1.05 exec uv run -q --no-project --with pillow --with numpy python -I /Users/waylonhuang/Documents/other/fitness/.claude/worktrees/avatar-explore/app/design/avatar/tools/render.py $out 420 $yaw "${args[@]}"

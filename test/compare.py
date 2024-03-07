# Copyright (c) 2021 TU Wien - All Rights Reserved.
# Unauthorized copying of this file is strictly prohibited.
#
# Contributors:
#   Michael Schröder <michael.schroeder@tuwien.ac.at>
#   Jürgen Cito <juergen.cito@tuwien.ac.at>
#   Valentin Jäch <valentin@deckweiss.at>

from cv2 import cv2
import numpy as np
import numpy.typing as npt
import os
import math
from pathlib import Path
import sys
from dataclasses import dataclass, asdict
from typing import Optional
import json
import argparse

Image = npt.ArrayLike
Index = int

@dataclass(frozen=True)
class Parameters:
  mergeDeltaX        : int   = 5
  mergeDeltaY        : int   = 5
  maxSizeDiff        : int   = 5
  pixelDiffThreshold : int   = 3
  maxPixelDiff       : float = 0.05
  maxPixelDiffZncc   : float = 0.50
  minZncc            : float = 0.95
  maxDistance        : int   = 5

@dataclass(frozen=True)
class Rect:
  x: int
  y: int
  w: int
  h: int

@dataclass(frozen=True)
class Diff:
  distance: float
  sizeDiff: int
  pixelDiff: float
  zncc: Optional[float] = None

@dataclass(frozen=True)
class Match:
  a: Index
  b: Index
  diff: Diff
  moved: bool

#-----------------------------------------------------------------------------

def intersects(a: Rect, b: Rect, dx: int, dy: int) -> bool:
  return not (
    a.x + a.w + dx < b.x or 
    b.x + b.w + dx < a.x or 
    a.y + a.h + dy < b.y or 
    b.y + b.h + dy < a.y
  )

def merge(a: Rect, b: Rect) -> Rect:
  minX = min(a.x, b.x)
  minY = min(a.y, b.y)
  maxX = max(a.x + a.w, b.x + b.w)
  maxY = max(a.y + a.h, b.y + b.h)
  return Rect(minX, minY, maxX - minX, maxY - minY)

def regions_of_interest(image: Image, params: Parameters) -> [Rect]:
  edges = cv2.Canny(image,50,150)
  kernel = np.ones((5,5),np.uint8)
  gradient = cv2.morphologyEx(edges, cv2.MORPH_GRADIENT, kernel)
  cnts = cv2.findContours(gradient, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
  cnts = cnts[0] if len(cnts) == 2 else cnts[1]
  rects = map(cv2.boundingRect, cnts)
  
  rects = list(map(lambda r: Rect(r[0],r[1],r[2],r[3]), rects))  
  rects.sort(key = lambda r: (r.x, r.y))

  rectsUsed = set()
  regions = []
  i = 0
  while i < len(rects):
    if i not in rectsUsed:
      rectsUsed.add(i)
      rect = rects[i]
    
      j = i + 1
      while j < len(rects):
        cand = rects[j]
        if j not in rectsUsed and intersects(rect, cand, params.mergeDeltaX, params.mergeDeltaY):
          rect = merge(rect, cand)
          rectsUsed.add(j)
          j = i + 1
        j = j + 1
    
      regions.append(rect)
    i = i + 1

  return regions

#-----------------------------------------------------------------------------

def pixel_difference(imgA: Image, imgB: Image, threshold: int = 0) -> float:
  height, width, _ = imgA.shape
  diffImg = cv2.absdiff(imgA, imgB)
  diffImg = cv2.cvtColor(diffImg, cv2.COLOR_BGR2GRAY)
  _, diffImg = cv2.threshold(diffImg, threshold, 255, cv2.THRESH_BINARY)
  numDiffPixels = cv2.countNonZero(diffImg)
  return numDiffPixels / (width * height)

def zero_normalized_cross_correlation(imgA: Image, imgB: Image) -> float:
  imgA = cv2.cvtColor(imgA, cv2.COLOR_BGR2GRAY)
  imgB = cv2.cvtColor(imgB, cv2.COLOR_BGR2GRAY)
  cc = np.mean(np.multiply((imgA - np.mean(imgA)), (imgB - np.mean(imgB))))  
  return cc / (np.std(imgA) * np.std(imgB))

def compare(imageA: Image, a: Rect, imageB: Image, b: Rect, params: Parameters) -> Optional[Diff]:
  distance = round(math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2))
  sizeDiff = abs(a.w - b.w) + abs(a.h - b.h)
  if sizeDiff > params.maxSizeDiff:
    return None
  subImgA = imageA[a.y:a.y+a.h, a.x:a.x+a.w]
  subImgB = imageB[b.y:b.y+b.h, b.x:b.x+b.w]
  if a.w != b.w or a.h != b.h:
    subImgB = cv2.resize(subImgB, (a.w, a.h), interpolation = cv2.INTER_NEAREST)
  pixelDiff = pixel_difference(subImgA, subImgB, params.pixelDiffThreshold)
  if pixelDiff > params.maxPixelDiffZncc: 
    return None
  zncc = zero_normalized_cross_correlation(subImgA, subImgB) if pixelDiff > params.maxPixelDiff else None
  if zncc is not None and zncc < params.minZncc:
    return None
  return Diff(distance, sizeDiff, pixelDiff, zncc)

def match_regions(imageA: Image, regionsA: [Rect], imageB: Image, regionsB: [Rect], params: Parameters) -> ([Match], [Index], [Index]):
  matches = []
  for i, a in enumerate(regionsA):
    for j, b in enumerate(regionsB):
      diff = compare(imageA, a, imageB, b, params)
      if diff is not None:
        moved = diff.distance > params.maxDistance
        matches.append(Match(i, j, diff, moved))
  
  matches.sort(key = lambda m: (m.diff.pixelDiff, (1 - m.diff.zncc)/2 if m.diff.zncc is not None else 0, m.diff.sizeDiff, m.diff.distance))

  bestMatches = []
  matchedAs = set()
  matchedBs = set()
  
  for m in matches:
    if m.a in matchedAs or m.b in matchedBs:
      continue
    bestMatches.append(m)
    matchedAs.add(m.a)
    matchedBs.add(m.b)

  leftoverAs = set(range(len(regionsA))).difference(matchedAs)
  leftoverBs = set(range(len(regionsB))).difference(matchedBs)
  
  return bestMatches, leftoverAs, leftoverBs

#-----------------------------------------------------------------------------

params = Parameters(**json.loads(sys.argv[3])) if len(sys.argv) > 3 else Parameters()

imageFileA = os.path.abspath(sys.argv[1])
imageA = cv2.imread(imageFileA)
regionsA = regions_of_interest(imageA, params)

imageFileB = os.path.abspath(sys.argv[2])
imageB = cv2.imread(imageFileB)
regionsB = regions_of_interest(imageB, params)

matches, leftoverAs, leftoverBs = match_regions(imageA, regionsA, imageB, regionsB, params)

result = {
  'parameters': asdict(params),
  'regions': {
    'a': list(map(asdict, regionsA)),
    'b': list(map(asdict, regionsB))
  },
  'matches': list(map(asdict, matches)),
  'leftovers': {
    'a': list(leftoverAs),
    'b': list(leftoverBs)
  }
}

print(json.dumps(result))

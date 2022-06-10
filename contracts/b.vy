# @version 0.3.3

#pragma once
#include "a.vy"
#include "sub/d.vy"

b: uint256

@internal
def b__init__():
    self.d__init__()

@internal
def _f(i: uint256) -> uint256:
    return i + 1
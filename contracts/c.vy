# @version 0.3.3

#pragma once
#include "a.vy"
#include "b.vy"

c: uint256

# this is a comment

@external
def g(j: uint256) -> uint256:
    return self._f(2*j)

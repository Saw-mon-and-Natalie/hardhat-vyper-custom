
a: uint256
d: uint256

@internal
def d__init__():
    self.d = 5

b: uint256

@internal
def b__init__():
    self.d__init__()

@internal
def _f(i: uint256) -> uint256:
    return i + 1

c: uint256


@external
def __init__():
    pass

@external
def g(j: uint256) -> uint256:
    return self._f(2*j)


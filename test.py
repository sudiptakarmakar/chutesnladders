#!/usr/bin/env python3.4

print("\n".join(["{0:#^{1}}".format(" "*x,20) for y in [[19],[1,2],[1,2],[1,2],[1]] for x in range(*y)]))
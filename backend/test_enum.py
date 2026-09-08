from enum import Enum
class T(str, Enum):
    F = "friendship"

print(f"Type: {type(T.F)}")
print(f"str(T.F): {str(T.F)}")
print(f"repr(T.F): {repr(T.F)}")
print(f"T.F.value: {T.F.value}")
print(f"T.F == 'friendship': {T.F == 'friendship'}")

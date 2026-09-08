from enum import StrEnum
class T(StrEnum):
    F = "friendship"

print(f"str(T.F): {str(T.F)}")
print(f"T.F == 'friendship': {T.F == 'friendship'}")

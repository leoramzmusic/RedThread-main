@echo off
echo === Activando entorno virtual ===
call venv\Scripts\activate

echo.
echo === Formateando con Black ===
python -m black src/

echo.
echo === Verificando con Flake8 ===
python -m flake8 src/

echo.
echo === Listo ===
pause

"""Aplica localmente un PR generado por Copilot.

Uso:
    python scripts/pull_copilot_pr.py <pr-number>

Trae la rama del PR, hace checkout en copilot/pr-<n> y muestra el diff.
"""
import subprocess
import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python scripts/pull_copilot_pr.py <pr-number>")
        return 1
    pr = sys.argv[1]
    if not pr.isdigit():
        print("El argumento debe ser el número de PR (entero).")
        return 1
    branch = f"copilot/pr-{pr}"
    commands = [
        ["git", "fetch", "origin", f"pull/{pr}/head:{branch}"],
        ["git", "checkout", branch],
        ["git", "diff", "--stat", "main...HEAD"],
    ]
    for command in commands:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[error] {' '.join(command)}\n{result.stderr}")
            return 1
        if result.stdout:
            print(result.stdout)
    print(
        f"\nPR #{pr} aplicada en la rama local '{branch}'.\n"
        "Ejecuta las pruebas, verifica y haz /done en Telegram cuando termines."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
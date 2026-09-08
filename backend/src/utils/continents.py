from typing import List, Dict

CONTINENT_COUNTRIES_MAP: Dict[str, List[str]] = {
    "Asia": [
        "Afganistán", "Arabia Saudita", "Armenia", "Azerbaiyán", "Baréin", "Bangladés", "Bután", 
        "Brunéi", "Camboya", "China", "Chipre", "Corea del Norte", "Corea del Sur", 
        "Emiratos Árabes Unidos", "Filipinas", "Georgia", "India", "Indonesia", "Irak", "Irán", 
        "Israel", "Japón", "Jordania", "Kazajistán", "Kirguistán", "Kuwait", "Laos", "Líbano", 
        "Malasia", "Maldivas", "Mongolia", "Myanmar", "Nepal", "Omán", "Pakistán", "Palestina", 
        "Catar", "Rusia", "Singapur", "Siria", "Sri Lanka", "Tailandia", "Tayikistán", 
        "Timor Oriental", "Turkmenistán", "Turquía", "Uzbekistán", "Vietnam", "Yemen"
    ],
    "África": [
        "Angola", "Argelia", "Benín", "Botsuana", "Burkina Faso", "Burundi", "Cabo Verde", 
        "Camerún", "Chad", "Comoras", "Costa de Marfil", "Egipto", "Eritrea", "Etiopía", 
        "Gabón", "Gambia", "Ghana", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Kenia", 
        "Lesoto", "Liberia", "Libia", "Madagascar", "Malaui", "Malí", "Marruecos", "Mauricio", 
        "Mauritania", "Mozambique", "Namibia", "Níger", "Nigeria", "República Centroafricana", 
        "República del Congo", "República Democrática del Congo", "Ruanda", "Santo Tomé y Príncipe", 
        "Senegal", "Seychelles", "Sierra Leona", "Somalia", "Suazilandia", "Sudáfrica", "Sudán", 
        "Sudán del Sur", "Tanzania", "Togo", "Túnez", "Uganda", "Yibuti", "Zambia", "Zimbabue"
    ],
    "América": [
        "Antigua y Barbuda", "Argentina", "Bahamas", "Barbados", "Belice", "Bolivia", "Brasil", 
        "Canadá", "Chile", "Colombia", "Costa Rica", "Cuba", "Dominica", "Ecuador", "El Salvador", 
        "Estados Unidos", "Granada", "Guatemala", "Guyana", "Haití", "Honduras", "Jamaica", 
        "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana", 
        "San Cristóbal y Nieves", "San Vicente y las Granadinas", "Santa Lucía", "Surinam", 
        "Trinidad y Tobago", "Uruguay", "Venezuela"
    ],
    "Europa": [
        "Albania", "Alemania", "Andorra", "Armenia", "Austria", "Azerbaiyán", "Bélgica", 
        "Bielorrusia", "Bosnia y Herzegovina", "Bulgaria", "Chipre", "Ciudad del Vaticano", 
        "Croacia", "Dinamarca", "Eslovaquia", "Eslovenia", "España", "Estonia", "Finlandia", 
        "Francia", "Georgia", "Grecia", "Hungría", "Irlanda", "Islandia", "Italia", "Kazajistán", 
        "Letonia", "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", "Malta", 
        "Moldavia", "Mónaco", "Montenegro", "Noruega", "Países Bajos", "Polonia", "Portugal", 
        "Reino Unido", "República Checa", "Rumania", "Rusia", "San Marino", "Serbia", "Suecia", 
        "Suiza", "Turquía", "Ucrania"
    ],
    "Oceanía": [
        "Australia", "Fiji", "Islas Marshall", "Islas Salomón", "Kiribati", "Micronesia", 
        "Nauru", "Nueva Zelanda", "Palau", "Papúa Nueva Guinea", "Samoa", "Tonga", "Tuvalu", "Vanuatu"
    ],
    "Antártida": []
}

def get_countries_by_continent(continent: str) -> List[str]:
    return CONTINENT_COUNTRIES_MAP.get(continent, [])

"""
Lista de emails permitidos para login.
Adicione aqui os emails dos colaboradores autorizados.
"""

ALLOWED_EMAILS = [
    # Administração / TI
    "bruno.pires@creditsbrasil.com.br",
    "renato.pavone@creditsbrasil.com.br",
    "giovanni.mirabelli@creditsbrasil.com.br",
    "joao.viveiros@creditsbrasil.com.br",
    "henrique.palotte@creditsbrasil.com.br",
    "maria.rodrigues@creditsbrasil.com.br",
    "crislaine.cardoso@creditsbrasil.com.br",
    "aryanne.silva@creditsbrasil.com.br",
    "rita.oliveira@creditsbrasil.com.br",
    "erika.almeida@creditsbrasil.com.br",
    "thaynara.santos@creditsbrasil.com.br",
    
    # Comercial / Operações
    "alexandre.abud@creditsbrasil.com.br",
    "jessica.araujo@creditsbrasil.com.br",
    "maria.vitoria@creditsbrasil.com.br",
    "juliana.maia@creditsbrasil.com.br",
    "paulo.costa@creditsbrasil.com.br",
    "mirela.dias@creditsbrasil.com.br",
    "jeferson.ribeiro@creditsbrasil.com.br",
    "felipe.faria@creditsbrasil.com.br",
    "liliane.oliveira@creditsbrasil.com.br",
    "jessica.mognon@creditsbrasil.com.br",
    "luciane.barcelos@creditsbrasil.com.br",
    "camila.sorage@creditsbrasil.com.br",
    "rafael.flores@creditsbrasil.com.br",
    "luciana.gazola@creditsbrasil.com.br",
    "lucas.martins@creditsbrasil.com.br",
    "camila.franzoi@creditsbrasil.com.br",
    "isabel.santos@creditsbrasil.com.br",
    "roberta.carioba@creditsbrasil.com.br",
    "fernando.martins@creditsbrasil.com.br",
    "bernardo.souza@creditsbrasil.com.br",
    "carlos.castro@creditsbrasil.com.br",
    "rebeca.belleze@creditsbrasil.com.br",
    "marcos.marthos@creditsbrasil.com.br",
    "renata.sousa@creditsbrasil.com.br",
    "gabriel.barcelos@creditsbrasil.com.br",
    "victor.luchesi@creditsbrasil.com.br",
    "wesley.lima@creditsbrasil.com.br",
    "otavio.binotto@creditsbrasil.com.br",
    "jordao.nascimento@creditsbrasil.com.br",
    "leonardo.silva@creditsbrasil.com.br",
    "ana.lopes@creditsbrasil.com.br",
]


def is_email_allowed(email: str) -> bool:
    """Verifica se o email está na lista de permitidos."""
    return email.lower().strip() in [e.lower() for e in ALLOWED_EMAILS]

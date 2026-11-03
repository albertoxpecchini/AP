# Il cruscotto della macchina del tempo è diventato la regia di Claude (tools/cruscotto/): la
# apre (o la riporta davanti) al centro dello schermo da 24".
& (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\cruscotto\cruscotto.ps1') @args

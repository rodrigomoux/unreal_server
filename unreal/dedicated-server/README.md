# Unreal Dedicated Server — integração

Projeto UE de referência: `D:\Unreal\testeServer2`.

## Responsabilidades do DS

- Autoridade do mundo e replicação  
- Validar join token com o backend (`ASurvivalGameMode::PreLogin`)  
- Heartbeats de capacidade (`POST /internal/heartbeat`)  
- Commits de inventário / build / death (futuro)  
- Checkpoints opacos periódicos (futuro)  

## Como rodar localmente (UE launcher sem target Server)

```bat
D:\Unreal\testeServer2\Saved\start_ds.cmd
```

Equivale a:

```bat
"D:\jogos\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe" "D:\Unreal\testeServer2\testeServer2.uproject" /Game/ThirdPerson/Lvl_ThirdPerson -server -log -port=7777 -nosteam
```

Client (login UI):

```bat
D:\Unreal\testeServer2\Saved\start_client.cmd
```

## Contrato HTTP interno

Base URL local: `http://127.0.0.1:3000`  
Header obrigatório: `x-internal-token: <INTERNAL_SERVICE_TOKEN>`

Config no projeto UE: `Config/DefaultGame.ini` → `[/Script/testeServer2.SurvivalBackendSettings]`  
(use aspas na URL: `ApiBaseUrl="http://127.0.0.1:3000"` — senão `//` vira comentário INI)

### Validate join

`POST /internal/validate-join`

```json
{
  "joinToken": "<token from client>",
  "dedicatedServerInstanceId": "local-ds-01"
}
```

### Heartbeat

`POST /internal/heartbeat` → `{ "playerCount": 42, "status": "online" }`

## Stub de bridge

Ver `bridge-contract.md` e `ds-bridge.http`.

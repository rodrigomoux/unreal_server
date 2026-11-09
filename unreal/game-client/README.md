# Unreal Game Client — integração

Projeto de referência: `D:\Unreal\testeServer2` (UE 5.8, C++ + Blueprint).

## Fluxo

1. `POST /auth/login` (ou register) → `accessToken`  
2. `GET /characters` → escolher `characterId`  
3. `POST /world/join` com Bearer → `host`, `port`, `joinToken`  
4. Conectar ao Dedicated Server via networking nativo UE passando o `joinToken`  
5. Aguardar autorização do DS; em falha, solicitar novo join  

Implementação no client:

- `USurvivalApiClient` / `USurvivalSessionSubsystem`
- `USurvivalLoginWidget` + `ASurvivalLoginGameMode` (mapa `/Game/Survival/Lvl_Login`)
- Travel: `{host}:{port}?joinToken={token}`

## Dedicated Server (validate-join)

Engine launcher **sem** target `Server` → rode o editor como DS:

```bat
"D:\jogos\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe" "D:\Unreal\testeServer2\testeServer2.uproject" /Game/ThirdPerson/Lvl_ThirdPerson -server -log -port=7777
```

`ASurvivalGameMode` valida `joinToken` em `PreLogin` via `POST /internal/validate-join` (`dedicatedServerInstanceId=local-ds-01`).

## Autoridade no client

Permitido localmente: UI, VFX, áudio, câmera, prediction visual, preview de build.

Proibido como fonte da verdade: HP, loot final, economia, dano, ownership de itens.

## Reconexão

Se a conexão UE cair: novo `/world/join` (ou endpoint futuro de reconnect token) e reconnect ao mesmo `instanceId` se online.

## Conta demo

`demo@survival.local` / `demo1234` (seed da API em development).

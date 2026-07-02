# RatioSplit SQLite

Self-hosted, kétfős havi arányos közös költségelszámoló Next.js + Prisma + SQLite stackkel.

## Mi ez?

A RatioSplit célja, hogy kiváltsa a Splitwise + Excel + manuális havi split-átállítás folyamatot.

Hónap közben csak rögzíted a költségeket:

- dátum,
- leírás,
- összeg,
- deviza,
- fizető,
- split típus.

Hónap végén megadod a havi arányt, például:

```text
Gergo: 57%
Partner: 43%
```

Az app kiszámolja, ki kinek mennyit fizessen.

## Lokális indítás

```bash
cp .env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```

Elérés:

```text
http://localhost:3000
```

## Lokális Docker build

```bash
docker compose up -d --build
```

## GitHub Container Registry workflow

A repo tartalmaz egy GitHub Actions workflow-t:

```text
.github/workflows/docker.yml
```

Ez minden `main` branch push után buildeli és publikálja az image-et ide:

```text
ghcr.io/<GITHUB_OWNER>/ratiosplit:latest
```

## Unraid deployment GHCR image-ből

1. Másold ki a `deploy/docker-compose.ghcr.yml` fájlt az Unraid szerverre, például ide:

```text
/mnt/user/appdata/ratiosplit/docker-compose.yml
```

2. Cseréld benne ezt:

```text
ghcr.io/OWNER/ratiosplit:latest
```

például erre:

```text
ghcr.io/gergokiss/ratiosplit:latest
```

3. Indítás:

```bash
cd /mnt/user/appdata/ratiosplit
docker compose up -d
```

## Frissítés kézzel

```bash
cd /mnt/user/appdata/ratiosplit
docker compose pull
docker compose up -d
```

## Opcionális automatikus frissítés

A `deploy/docker-compose.watchtower.yml` tartalmaz egy Watchtower-kompatibilis verziót.

Ezt csak akkor használd, ha már stabil a projekt, mert minden új `latest` image automatikusan települhet.

## SQLite adatbázis

Az adatbázis konténeren belül:

```text
/data/ratiosplit.db
```

Unraid hoston a javasolt hely:

```text
/mnt/user/appdata/ratiosplit/data/ratiosplit.db
```

Backupnál a teljes `data` mappát mentsd.

## Funkciók

- SQLite, külön DB konténer nélkül
- költségfelvitel
- deviza kézi árfolyammal
- havi arány megadása
- havi elszámolás
- split típusok:
  - havi arány,
  - 50/50,
  - csak Gergo,
  - csak Partner,
  - egyedi százalék,
  - kihagyva
- CSV export
- PWA manifest alap

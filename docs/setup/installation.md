# Installation

## Requirements

- The [Bun Runtime](https://bun.sh), version 1.2.0 or later (usage of the latest version is recommended)
  - Versia Server will not work on lower versions than 1.2.0.
- A PostgreSQL database
- (Optional but recommended) A Linux-based operating system
- (Optional if you want search) A working [Sonic](https://github.com/valeriansaliou/sonic) instance

> [!WARNING]
> Versia Server has not been tested on Windows or macOS. It is recommended to use a Linux-based operating system to run Versia Server.
>
> We will not be offering support to Windows or macOS users. If you are using one of these operating systems, please use a virtual machine or container to run Versia Server.

## With Docker/Podman

Docker is the recommended way to run Versia Server (Podman also works). To run Versia Server with Docker, follow these steps:

1. Download the `docker-compose.yml` file from the repository

> [!NOTE]
> You may need to change the image from `ghcr.io/versia-pub/server:latest` to `ghcr.io/versia-pub/server:main` if you want to use the latest changes from the `main` branch. Make sure to use the config template from the same branch as the server.

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/versia-pub/server/v0.7.0/docker-compose.yml
```
1. Edit the `docker-compose.yml` file to set up the database connection and other settings
2. Download the `config.example.toml` file from the repository

```bash
curl -o config.example.toml https://raw.githubusercontent.com/versia-pub/server/v0.7.0/config/config.example.toml
```
4. Edit the `config.example.toml` file to set up the database connection and other settings, rename it to `config.toml`, then place it inside `config/` (create the `config/` directory if it does not exist)
5. Run the following command to start the server:

> [!WARNING]
> The first time you start the server, it will generate keys which will be printed in logs. The server will not start until you put these keys in the config file.

```bash
docker compose up
```

You may need root privileges to run Docker commands.

To check server logs, run `docker compose logs versia`. The server will likely stop if there is an error, so you can check the logs to see what went wrong.

## From Source

1. Clone this repository

```bash
git clone https://github.com/versia-pub/server.git
```

2. Install the dependencies

```bash
bun install
```

1. Set up a PostgreSQL database (you need a special extension, please look at [the database documentation](./database.md))

2. (If you want search)
Create a [Sonic](https://github.com/valeriansaliou/sonic) instance (using Docker is recommended). For a [`docker-compose`] file, copy the `sonic` service from the [`docker-compose.yml`](https://github.com/versia-pub/server/blob/v0.7.0/docker-compose.yml) file. Don't forget to fill in the `config.cfg` for Sonic!

1. Build everything:

```bash
bun run build
```

4. Copy the `config.example.toml` file to `config.toml` inside `dist/config/` and fill in the values (you can leave most things to the default, but you will need to configure things such as the database connection)

5. Move to the `dist/` directory

```bash
cd dist
```

You may now start the server with `bun run cli/index.js start`. All other code not in the `dist/` directory can be removed.

## Running the Server

Database migrations are run automatically on startup.

Please see the [CLI documentation](../cli/index.md) for more information on how to use the CLI.

## Updating the server

Updating the server is as simple as pulling the latest changes from the repository and running `bun run build` again. You may need to run `bun install` again if there are new dependencies.

For Docker, you can run `docker-compose pull` to update the Docker images.

Sometimes, new configuration options are added to `config.example.toml`. If you see a new option in the example file, you should add it to your `config.toml` file.

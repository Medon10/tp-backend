create database if not exists VuelosApp;

use VuelosApp;

## uncomment if you are not using docker
create user if not exists dsw@'%' identified by 'dsw';
grant select, update, insert, delete on VuelosApp.* to dsw@'%';


create table if not exists `VuelosApp`.`users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NULL,
    `apellido` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `contraseña` VARCHAR(255) NULL,
    `telefono` INT UNSIGNED NULL,
    PRIMARY KEY (`id`));


insert into VuelosApp.users values(1,'Juanmpi','Binomio','jb999@gmail.com','jb02022002', '434150654');

create table if not exists `VuelosApp`.`flights` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `fechahora_salida` VARCHAR(255) NULL,
    `fechahora_llegada` VARCHAR(255) NULL,
    `duracion` INT UNSIGNED NULL,
    `aerolinea` VARCHAR(255) NULL,
    `cantidad_asientos` INT UNSIGNED NULL,
    PRIMARY KEY (`id`));

insert into VuelosApp.flights values(1,'2026-02-08 10:00','2026-02-08 18:00',6,'American Airlines',200);

create table if not exists `VuelosApp`.`destinies` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NULL,
    `transporte` VARCHAR(255) NULL,
    `actividades` VARCHAR(255) NULL,
    PRIMARY KEY (`id`));

insert into VuelosApp.destinies values(1,'Rio de Janeiro', 'Colectivo, Bicicleta', 'Playa, Jugar');

create table if not exists `VuelosApp`.`trips` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `fecha_salida` DATE NOT NULL,
    `fecha_llegada` DATE NULL,
    `estado` ENUM('pendiente', 'confirmado', 'cancelado', 'completado') NOT NULL,
    `usuario_id` INT UNSIGNED NULL,
    `destino_id` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`usuario_id`) REFERENCES `VuelosApp`.`users`(`id`),
    FOREIGN KEY (`destino_id`) REFERENCES `VuelosApp`.`destinies`(`id`));

insert into VuelosApp.trips values(1,'2026-10-01','2026-10-01','pendiente',1,1);
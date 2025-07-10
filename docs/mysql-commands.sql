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

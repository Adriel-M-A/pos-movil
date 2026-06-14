CREATE TABLE `cajas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha_apertura` text NOT NULL,
	`fondo_inicial` real NOT NULL,
	`fecha_cierre` text,
	`monto_contado` real,
	`estado` text DEFAULT 'abierta' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `configuraciones` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `venta_pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`venta_id` integer NOT NULL,
	`metodo` text NOT NULL,
	`monto` real NOT NULL,
	FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ventas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caja_id` integer NOT NULL,
	`monto` real NOT NULL,
	`timestamp` text NOT NULL,
	`nota` text,
	FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON UPDATE no action ON DELETE no action
);

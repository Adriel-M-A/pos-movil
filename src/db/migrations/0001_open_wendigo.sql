PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_venta_pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`venta_id` integer NOT NULL,
	`metodo` text NOT NULL,
	`monto` real NOT NULL,
	FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_venta_pagos`("id", "venta_id", "metodo", "monto") SELECT "id", "venta_id", "metodo", "monto" FROM `venta_pagos`;--> statement-breakpoint
DROP TABLE `venta_pagos`;--> statement-breakpoint
ALTER TABLE `__new_venta_pagos` RENAME TO `venta_pagos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `venta_pagos_venta_id_idx` ON `venta_pagos` (`venta_id`);--> statement-breakpoint
CREATE TABLE `__new_ventas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caja_id` integer NOT NULL,
	`monto` real NOT NULL,
	`timestamp` text NOT NULL,
	`nota` text,
	FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ventas`("id", "caja_id", "monto", "timestamp", "nota") SELECT "id", "caja_id", "monto", "timestamp", "nota" FROM `ventas`;--> statement-breakpoint
DROP TABLE `ventas`;--> statement-breakpoint
ALTER TABLE `__new_ventas` RENAME TO `ventas`;--> statement-breakpoint
CREATE INDEX `ventas_caja_id_idx` ON `ventas` (`caja_id`);--> statement-breakpoint
CREATE INDEX `ventas_timestamp_idx` ON `ventas` (`timestamp`);
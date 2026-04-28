import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MangasService } from './mangas.service';
import { MangasRepository } from './mangas.repository';
import { MangasController } from './mangas.controller';
import { Manga, MangaSchema } from './schemas/manga.schema';
import { LeermangaStrategyModule } from './strategies/leermanga/leermanga-strategy.module';
import { ManhwawebStrategyModule } from './strategies/manhwaweb/manhwaweb-strategy.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Manga.name, schema: MangaSchema }]),
    LeermangaStrategyModule,
    ManhwawebStrategyModule,
  ],
  controllers: [MangasController],
  providers: [MangasService, MangasRepository],
  exports: [MangasService],
})
export class MangasModule {}
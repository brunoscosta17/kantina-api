import { PartialType } from '@nestjs/swagger';
import { CreateCatalogItemDto } from './create-item.dto';

export class UpdateCatalogItemDto extends PartialType(CreateCatalogItemDto) {}

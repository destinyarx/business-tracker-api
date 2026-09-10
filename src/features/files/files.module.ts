import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';

@Module({
	imports: [SupabaseModule],
	controllers: [FilesController],
	providers: [FilesService],
})
export class FilesModule {}

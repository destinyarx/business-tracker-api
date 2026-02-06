import { Injectable } from '@nestjs/common';
import { supabase } from 'src/common/supabase';

@Injectable()
export class FilesService {
    async uploadProductImage(userId: string, buffer: Buffer, filename: string, mimetype: string) {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET!;
        const name = `${userId}-${Date.now()}-${crypto.randomUUID()}-${filename}`;
        const path = `${userId}/${name}`

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, buffer, {
                contentType: mimetype,
                upsert: false,
            });

        if (error) {
            console.log(error)
            throw error
        }

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);

        return {
            imageName: name, 
            path: data.path, 
            publicUrl: publicData.publicUrl 
        };
    }

    async deleteProductImage(userId: string, filename: string) {
        const { error } = await supabase.storage
            .from('product-images')
            .remove([`${userId}/${filename}`])
          
        if (error) {
            throw error
        }

        return true
    }
}

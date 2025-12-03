// components/FileInput.tsx - SHORT VERSION
'use client';

import { supabase } from '@/lib/supabaseClient';
import { InboxOutlined, LoadingOutlined, FileDoneOutlined, FilePdfOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import { useState } from 'react'; // Tambahkan ini

const { Dragger } = Upload;

interface FileInputProps {
    userId: string;
    file_name: string
    onSuccess?: (data: any) => void;
    existingRecordId?: string; // ID record yang sudah ada (opsional)
}

const FileInput: React.FC<FileInputProps> = ({ userId, file_name, onSuccess, existingRecordId }) => {
    const [loading, setLoading] = useState(false); // State untuk loading
    

    const fetching = async (fileUrl: string, user_id: string) => {
        console.log("fileUrl: ", fileUrl);
        try {
            const response = await fetch('/api/extract-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileUrl: fileUrl,
                    user_id: user_id
                })
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            const data = await response.json();
            console.log("Response data:", data);

            if (data.success) {
                console.log("Extracted text length:", data.text.length);
                console.log("File type:", data.fileType);
                return data.text;
            } else {
                console.error("Error from API:", data.error);
            }

        } catch (error) {
            console.error("Fetch error:", error);
        }
    }

    const handleUpload = async (file: File) => {
        if (!userId) {
            message.error('User ID is required');
            return false;
        }

        setLoading(true); // Mulai loading

        try {
            // 1. Upload ke storage
            const fileName = `${userId}/${Date.now()}-${file.name}`;
            await supabase.storage.from('cvs').upload(fileName, file);

            // 2. Dapatkan URL
            const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(fileName);

            const response = await fetching(urlData.publicUrl, userId);
            console.log("response: ", response);

            // 3. Jika ada existingRecordId, update data yang ada
            if (existingRecordId) {
                const { data: updateData } = await supabase
                    .from('user_cvs')
                    .update({
                        user_id: userId,
                        file_name: file.name,
                        file_url: urlData.publicUrl,
                        file_size: file.size,
                        extracted_text: response,
                        file_type: file.type,
                        storage_path: fileName,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingRecordId)
                    .select()
                    .single();

                onSuccess?.(updateData);
                message.success(`${file.name} reuploaded successfully!`);
                console.log("url pdf updated: ", updateData?.file_url);
            } else {
                // 4. Jika tidak ada existingRecordId, cek apakah sudah ada data untuk user ini
                const { data: existingData } = await supabase
                    .from('user_cvs')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                let resultData;
                
                if (existingData?.id) {
                    // Jika sudah ada data untuk user ini, update data yang ada
                    const { data: updateData } = await supabase
                        .from('user_cvs')
                        .update({
                            user_id: userId,
                            file_name: file.name,
                            file_url: urlData.publicUrl,
                            file_size: file.size,
                            extracted_text: response,
                            file_type: file.type,
                            storage_path: fileName,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', existingData.id)
                        .select()
                        .single();
                    
                    resultData = updateData;
                    message.success(`${file.name} replaced existing file!`);
                } else {
                    // Jika belum ada data, buat baru
                    const { data: insertData } = await supabase
                        .from('user_cvs')
                        .insert({
                            user_id: userId,
                            file_name: file.name,
                            file_url: urlData.publicUrl,
                            file_size: file.size,
                            extracted_text: response,
                            file_type: file.type,
                            storage_path: fileName,
                        })
                        .select()
                        .single();
                    
                    resultData = insertData;
                    message.success(`${file.name} uploaded!`);
                }

                onSuccess?.(resultData);
                console.log("url pdf: ", resultData?.file_url);
            }

            setLoading(false); // Selesai loading
            return false; // Return false untuk mencegah upload default

        } catch (error: any) {
            message.error(`Upload failed: ${error.message}`);
            setLoading(false); // Selesai loading meski error
            return false;
        }
    };

    return (
        <div className='w-full flex flex-col items-center justify-center'>
            <Upload
                beforeUpload={handleUpload}
                showUploadList={false}
                accept=".pdf"
                maxCount={1}
                multiple={false}
                disabled={loading}
            >
                <Dragger 
                    className={`w-full flex flex-col items-center justify-center py-8 px-4 ${
                        file_name 
                            ? 'border-2 border-blue-300 border-dashed bg-blue-50 hover:bg-blue-100' 
                            : 'border-2 border-gray-300 border-dashed hover:border-blue-400'
                    } rounded-lg transition-all duration-200`}
                    showUploadList={false}
                    multiple={false}
                >
                    <div className="ant-upload-drag-icon mb-4">
                        {loading ? (
                            <LoadingOutlined className='text-blue-500 text-3xl' spin />
                        ) : (
                            file_name ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative mb-2">
                                        <FilePdfOutlined className="text-red-500 text-3xl" />
                                        <CloudUploadOutlined className="text-blue-500 text-sm absolute -top-1 -right-1 bg-white rounded-full p-1 border border-blue-200" />
                                    </div>
                                    <div className="max-w-xs bg-white px-3 py-1 rounded border border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 truncate flex items-center gap-1">
                                            <FilePdfOutlined className="text-red-400" />
                                            {file_name}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <InboxOutlined className='text-3xl text-blue-400' />
                            )
                        )}
                    </div>
                    
                    <p className="ant-upload-text font-medium text-gray-700 mb-2">
                        {loading ? 'Processing...' : (
                            file_name ? 'Click or drag to replace PDF file' : 'Click or drag PDF file to upload'
                        )}
                    </p>
                    
                    <p className="ant-upload-hint text-gray-500 mb-3">
                        {file_name ? 'Upload new file to replace existing CV' : 'Upload your CV in PDF format'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <p className="ant-upload-hint text-xs text-gray-400">
                            Uploading for user: <span className="font-mono text-gray-600">{userId?.substring(0, 8)}...</span>
                        </p>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full text-xs font-medium ${
                        file_name 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                        {file_name 
                            ? 'File will be replaced when uploading new one' 
                            : 'File will replace existing one if already uploaded'}
                    </div>
                </Dragger>
            </Upload>
        </div>
    );
};

export default FileInput;
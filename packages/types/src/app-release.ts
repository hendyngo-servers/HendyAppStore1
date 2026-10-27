export interface AppRelease {
  id: string;
  version: string;
  build_number: number;
  platform: 'ios' | 'android' | 'macos' | 'windows';
  download_url: string;
  manifest_url?: string;
  release_notes: string;
  is_mandatory: boolean;
  min_supported_version: string;
  file_size_bytes: number;
  sha256_checksum: string;
  status: 'draft' | 'published' | 'deprecated';
  created_at: string;
}

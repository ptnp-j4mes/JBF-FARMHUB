/**
 * DocumentPage Component
 * 
 * Main page for document management
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { PageHeader, StatsCard, ConfirmDialog } from '@/components/common';
import { DocumentList, DocumentFilters, DocumentUploadDialog } from './components';
import { documentService } from './services/document.service';
import type { DocumentResponse, DocumentUploadRequest, DocumentFilterParams } from './types';

export function DocumentPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [filters, setFilters] = useState<DocumentFilterParams>({
    documentType: '',
    status: '',
    search: '',
  });

  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getAll();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (filters.search && !doc.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.documentType && doc.documentType !== filters.documentType) {
      return false;
    }
    if (filters.status && doc.status !== filters.status) {
      return false;
    }
    return true;
  });

  // Handle upload
  const handleUpload = async (data: DocumentUploadRequest) => {
    try {
      await documentService.upload(data);
      setUploadDialogOpen(false);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('ไม่สามารถอัพโหลดเอกสารได้');
    }
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setSelectedDocId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDocId) {
      try {
        await documentService.delete(selectedDocId);
        setDeleteConfirmOpen(false);
        await loadDocuments();
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('ไม่สามารถลบเอกสารได้');
      }
    }
  };

  // Handle download
  const handleDownload = async (document: DocumentResponse) => {
    try {
      const blob = await documentService.download(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('ไม่สามารถดาวน์โหลดเอกสารได้');
    }
  };

  // Calculate stats
  const stats = {
    total: documents.length,
    active: documents.filter((d) => d.status === 'Active').length,
    draft: documents.filter((d) => d.status === 'Draft').length,
    archived: documents.filter((d) => d.status === 'Archived').length,
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 4 } }}>
      {/* Header */}
      <PageHeader
        title="ระบบเอกสาร"
        subtitle="จัดการเอกสารในระบบ"
        actions={
          <>
            <Button startIcon={<RefreshIcon />} onClick={loadDocuments}>
              รีเฟรช
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              อัพโหลดเอกสาร
            </Button>
          </>
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="ทั้งหมด" value={stats.total} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="ใช้งาน" value={stats.active} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="ร่าง" value={stats.draft} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="เก็บถาวร" value={stats.archived} color="info" />
        </Grid>
      </Grid>

      {/* Filters */}
      <DocumentFilters filters={filters} onChange={setFilters} />

      {/* List */}
      <DocumentList
        documents={filteredDocuments}
        loading={loading}
        onView={(doc) => console.log('View:', doc)}
        onEdit={(doc) => console.log('Edit:', doc)}
        onDelete={handleDeleteClick}
        onDownload={handleDownload}
      />

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSubmit={handleUpload}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="ยืนยันการลบ"
        message="คุณต้องการลบเอกสารนี้ใช่หรือไม่?"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}

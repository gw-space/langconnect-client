import * as XLSX from 'xlsx';

// 청크 데이터를 원본 그대로 엑셀로 내보내기
export const exportChunksToExcel = (chunks: any[], filename: string = 'chunks_export.xlsx'): void => {
  try {
    if (!chunks || chunks.length === 0) {
      throw new Error('내보낼 데이터가 없습니다.');
    }

    console.log('Exporting chunks:', chunks.length, 'items');

    // 청크 데이터를 엑셀 형식으로 변환
    const exportData = chunks.map((chunk, index) => {
      const row: any = {
        '번호': index + 1,
        'ID': chunk.id || '',
        '내용': chunk.content || '',
        '문자수': chunk.content?.length || 0,
      };

      // 메타데이터가 있으면 모든 필드를 추가
      if (chunk.metadata && typeof chunk.metadata === 'object') {
        Object.entries(chunk.metadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            // 객체나 배열인 경우 JSON 문자열로 변환
            if (typeof value === 'object') {
              row[key] = JSON.stringify(value);
            } else {
              row[key] = String(value);
            }
          }
        });
      }

      // 추가 필드들
      if (chunk.file_id) row['파일ID'] = chunk.file_id;
      if (chunk.chunk_index !== undefined) row['청크인덱스'] = chunk.chunk_index;
      if (chunk.total_chunks !== undefined) row['전체청크수'] = chunk.total_chunks;
      if (chunk.page_content) row['페이지내용'] = chunk.page_content;

      return row;
    });

    console.log('Processed export data:', exportData.length, 'rows');

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 컬럼 너비 자동 조정
    const columnWidths = getColumnWidths(exportData);
    worksheet['!cols'] = columnWidths;

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chunks');

    // 파일 다운로드
    XLSX.writeFile(workbook, filename);
    
    console.log('Excel file exported successfully:', filename);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error(`엑셀 내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

// 컬럼 너비 계산 헬퍼 함수
const getColumnWidths = (data: any[]): Array<{ width: number }> => {
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  return headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => {
        const value = row[header];
        return value ? String(value).length : 0;
      })
    );
    // 최소 10, 최대 100으로 제한
    return { width: Math.min(Math.max(maxLength + 2, 10), 100) };
  });
};

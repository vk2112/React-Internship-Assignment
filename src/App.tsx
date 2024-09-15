import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { PrimeIcons } from 'primereact/api';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  date_start: number;
  date_end: number;
}

const ArtworkTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedRowsByPage, setSelectedRowsByPage] = useState<{ [key: number]: Artwork[] }>({});
  const [rowCount, setRowCount] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);

  // Fetch data when the page changes
  useEffect(() => {
    fetchData(page);
  }, [page]);

  // Function to fetch from the API
  const fetchData = async (pageNumber: number) => {
    setLoading(true);
    const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}`);
    const data = await response.json();
    setArtworks(data.data);
    setTotalRecords(data.pagination.total);
    setLoading(false);

    const pageSelections = selectedRowsByPage[pageNumber] || [];
    setSelectedArtworks(pageSelections);
  };

  const onPageChange = (e: any) => {
    setPage(e.page + 1);
  };

  const onSelectionChange = (e: any) => {
    const selectedRowsForPage = [...e.value];
    setSelectedRowsByPage((prevSelections) => ({
      ...prevSelections,
      [page]: selectedRowsForPage,
    }));
    setSelectedArtworks(selectedRowsForPage);
  };

  // Function to select rows
  const selectRows = async () => {
    let accumulatedRows: Artwork[] = [...artworks];
    let currentPage = page;
    let remainingRows = rowCount ? rowCount - accumulatedRows.length : 0;

    while (remainingRows > 0 && accumulatedRows.length < rowCount!) {
      currentPage += 1;
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentPage}`);
      const data = await response.json();
      accumulatedRows = [...accumulatedRows, ...data.data];
      remainingRows -= data.data.length;
    }

    // Select the final rows
    const finalSelectedRows = accumulatedRows.slice(0, rowCount!);
    setSelectedArtworks(finalSelectedRows);

    // Update selections
    const updatedSelections = { ...selectedRowsByPage };
    updatedSelections[page] = artworks.slice(0, Math.min(artworks.length, rowCount!));

    if (finalSelectedRows.length > artworks.length) {
      const additionalRows = finalSelectedRows.slice(artworks.length);
      let startIndex = 0;
      let additionalPage = page + 1;

      while (startIndex < additionalRows.length) {
        updatedSelections[additionalPage] = additionalRows.slice(startIndex, startIndex + 12);
        startIndex += 12;
        additionalPage += 1;
      }
    }

    setSelectedRowsByPage(updatedSelections);
    op.current?.hide();
  };

  return (

    <div style={{padding: '0 16px'}}>
<style>
        {`
        .p-inputnumber-input {
          width: 100% !important;
        }
        `}
      </style>
      
      <DataTable
        value={artworks}
        paginator
        rows={12}
        totalRecords={totalRecords}
        lazy
        loading={loading}
        onPage={onPageChange}
        selection={selectedArtworks}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        selectionMode="checkbox"
      >
        <Column selectionMode="multiple" headerStyle={{width: '3rem'}}></Column>
        <Column
          field="title"
          header={
            <div style={{display: 'flex', alignItems: 'center'}}>
              <i
                className={PrimeIcons.CHEVRON_DOWN}
                style={{marginRight: '8px', cursor: 'pointer'}}
                onClick={(e) => op.current?.toggle(e)}
              />
              <span>Title</span>
            </div>
          }
        />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>

      <OverlayPanel ref={op} style={{width: '220px'}}>
        <div>
          <InputNumber
            value={rowCount}
            onValueChange={(e) => setRowCount(e.value as number)}
            placeholder="Select rows..."
          />
          <Button label="Submit" onClick={selectRows} style={{marginTop: '10px', marginLeft: '83px', background: '#fff', color: 'grey', border: '1px solid #dad7d7'}} />
        </div>
      </OverlayPanel>
    </div>
  );
};

export default ArtworkTable;

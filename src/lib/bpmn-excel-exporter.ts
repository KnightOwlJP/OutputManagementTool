/**
 * BPMN flows to editable Excel (XLSX) shapes.
 * - Swimlanes: cell fill styling
 * - Task/Gateway/Event: autoshapes (rect/diamond/circle)
 * - Sequence flow: line autoshape
 */

import JSZip from 'jszip';
import { Process, Swimlane, ProcessTable } from '@/types/models';
import { layoutBpmnProcess } from '@/lib/elk-layout';

const PX_PER_COL = 90; // keeps approximate visual scale vs diagram px
const PX_PER_ROW = 50;
const PADDING_PX = 60; // breathing room around shapes
const EMU_PER_PX = 9525;

interface Anchor {
  fromCol: number;
  fromColOff: number;
  fromRow: number;
  fromRowOff: number;
  toCol: number;
  toColOff: number;
  toRow: number;
  toRowOff: number;
  cx: number;
  cy: number;
}

function clampColorHex(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const hex = color.replace('#', '').trim();
  if (hex.length === 6) return hex.toUpperCase();
  if (hex.length === 3) {
    const [r, g, b] = hex.split('');
    return `${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

function lighten(hex: string, factor = 0.2): string {
  const c = clampColorHex(hex, 'E5E7EB');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const lerp = (v: number) => Math.round(v + (255 - v) * factor);
  const lr = lerp(r).toString(16).padStart(2, '0');
  const lg = lerp(g).toString(16).padStart(2, '0');
  const lb = lerp(b).toString(16).padStart(2, '0');
  return `${lr}${lg}${lb}`.toUpperCase();
}

function toLetters(col: number): string {
  let n = col;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function toAnchor(x: number, y: number, width: number, height: number): Anchor {
  const paddedX = x + PADDING_PX;
  const paddedY = y + PADDING_PX;
  const fromCol = Math.floor(paddedX / PX_PER_COL) + 1; // 0-indexed for drawing, +1 to skip lane名列
  const fromRow = Math.floor(paddedY / PX_PER_ROW) + 1;
  const toCol = Math.ceil((paddedX + width) / PX_PER_COL) + 1;
  const toRow = Math.ceil((paddedY + height) / PX_PER_ROW) + 1;

  const fromColOff = Math.round((paddedX - (fromCol - 1) * PX_PER_COL) * EMU_PER_PX);
  const fromRowOff = Math.round((paddedY - (fromRow - 1) * PX_PER_ROW) * EMU_PER_PX);
  const toColOff = Math.round((paddedX + width - (toCol - 1) * PX_PER_COL) * EMU_PER_PX);
  const toRowOff = Math.round((paddedY + height - (toRow - 1) * PX_PER_ROW) * EMU_PER_PX);

  return {
    fromCol,
    fromColOff,
    fromRow,
    fromRowOff,
    toCol,
    toColOff,
    toRow,
    toRowOff,
    cx: Math.round(width * EMU_PER_PX),
    cy: Math.round(height * EMU_PER_PX),
  };
}

function makeCell(row: number, col: number, value: string, style?: number): string {
  const colRef = toLetters(col);
  const sAttr = style !== undefined ? ` s=\"${style}\"` : '';
  return `<c r=\"${colRef}${row}\" t=\"inlineStr\"${sAttr}><is><t>${value}</t></is></c>`;
}

function sheetXml(
  numCols: number,
  numRows: number,
  lanes: Array<{ startRow: number; endRow: number; name: string; styleId: number }>,
  laneLabelRows: Map<string, number>,
): string {
  const dim = `${toLetters(numCols)}${numRows}`;
  const rows: string[] = [];
  for (let r = 1; r <= numRows; r++) {
    const lane = lanes.find(l => r >= l.startRow && r <= l.endRow);
    const cells: string[] = [];
    if (lane) {
      const labelRow = laneLabelRows.get(lane.name);
      const isLabelRow = labelRow === r;
      const style = lane.styleId;
      const name = isLabelRow ? lane.name : '';
      cells.push(makeCell(r, 1, name, style));
      // fill remaining columns for background consistency
      for (let c = 2; c <= numCols; c++) {
        cells.push(makeCell(r, c, '', lane.styleId));
      }
    }
    if (!lane) {
      rows.push(`<row r=\"${r}\" ht=\"${PX_PER_ROW}\" customHeight=\"1\"></row>`);
      continue;
    }
    rows.push(`<row r=\"${r}\" ht=\"${PX_PER_ROW}\" customHeight=\"1\">${cells.join('')}</row>`);
  }

  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">
  <dimension ref=\"A1:${dim}\"/>
  <sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>
  <sheetFormatPr defaultRowHeight=\"20\"/>
  <cols>
    <col min=\"1\" max=\"1\" width=\"18\" customWidth=\"1\"/>
    <col min=\"2\" max=\"${numCols}\" width=\"14\" customWidth=\"1\"/>
  </cols>
  <sheetData>
    ${rows.join('')}
  </sheetData>
  <drawing r:id=\"rId1\"/>
</worksheet>`;
}

function stylesXml(laneFills: string[]): { xml: string; laneStyleIds: number[] } {
  const fills: string[] = [
    '<fill><patternFill patternType="none"/></fill>',
    ...laneFills.map(color => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`),
  ];

  const laneStyleIds: number[] = [];
  const cellXfs: string[] = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
  ];

  laneFills.forEach((_, idx) => {
    const fillId = idx + 1;
    const styleId = cellXfs.length;
    laneStyleIds.push(styleId);
    cellXfs.push(
      `<xf numFmtId="0" fontId="0" fillId="${fillId}" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>`
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><name val="Calibri"/><sz val="11"/></font></fonts>
  <fills count="${fills.length}">${fills.join('')}</fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${cellXfs.length}">${cellXfs.join('')}</cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  return { xml, laneStyleIds };
}

function workbookXml(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">
  <workbookPr date1904=\"false\"/>
  <sheets>
    <sheet name=\"BPMN\" sheetId=\"1\" r:id=\"rId1\"/>
  </sheets>
</workbook>`;
}

function workbookRels(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>
</Relationships>`;
}

function sheetRels(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing\" Target=\"../drawings/drawing1.xml\"/>
</Relationships>`;
}

function rootRels(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>
  <Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>
</Relationships>`;
}

function contentTypes(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">
  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>
  <Default Extension=\"xml\" ContentType=\"application/xml\"/>
  <Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>
  <Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>
  <Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>
  <Override PartName=\"/xl/drawings/drawing1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawing+xml\"/>
  <Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>
  <Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>
</Types>`;
}

function coreProps(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">
  <dc:title>BPMN Flow</dc:title>
  <dc:creator>Output Management Tool</dc:creator>
  <cp:lastModifiedBy>Output Management Tool</cp:lastModifiedBy>
  <dcterms:created xsi:type=\"dcterms:W3CDTF\">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type=\"dcterms:W3CDTF\">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;
}

function appProps(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">
  <Application>Output Management Tool</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size=\"1\" baseType=\"lpstr\"><vt:lpstr>BPMN</vt:lpstr></vt:vector></TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>`;
}

function shapeXml(id: number, name: string, anchor: Anchor, type: 'task' | 'gateway' | 'event', label: string): string {
  const geom = type === 'gateway' ? 'diamond' : type === 'event' ? 'ellipse' : 'roundRect';
  const fill = type === 'gateway' ? 'E0F2FE' : type === 'event' ? 'FEE2E2' : 'FFFFFF';
  const stroke = '111827';
  return `<xdr:twoCellAnchor editAs=\"absolute\">
    <xdr:from><xdr:col>${anchor.fromCol}</xdr:col><xdr:colOff>${anchor.fromColOff}</xdr:colOff><xdr:row>${anchor.fromRow}</xdr:row><xdr:rowOff>${anchor.fromRowOff}</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>${anchor.toCol}</xdr:col><xdr:colOff>${anchor.toColOff}</xdr:colOff><xdr:row>${anchor.toRow}</xdr:row><xdr:rowOff>${anchor.toRowOff}</xdr:rowOff></xdr:to>
    <xdr:sp>
      <xdr:nvSpPr><xdr:cNvPr id=\"${id}\" name=\"${name}\"/><xdr:cNvSpPr/></xdr:nvSpPr>
      <xdr:spPr>
        <a:xfrm><a:off x=\"0\" y=\"0\"/><a:ext cx=\"${anchor.cx}\" cy=\"${anchor.cy}\"/></a:xfrm>
        <a:prstGeom prst=\"${geom}\"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val=\"${fill}\"/></a:solidFill>
        <a:ln w=\"15240\"><a:solidFill><a:srgbClr val=\"${stroke}\"/></a:solidFill></a:ln>
      </xdr:spPr>
      <xdr:txBody>
        <a:bodyPr wrap=\"square\" rtlCol=\"0\"/>
        <a:lstStyle/>
        <a:p><a:r><a:rPr lang=\"ja-JP\" sz=\"1100\" b=\"1\"/><a:t>${label}</a:t></a:r></a:p>
      </xdr:txBody>
    </xdr:sp>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
}

function connectionIdx(start: { x: number; y: number }, end: { x: number; y: number }): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 1 : 3; // right or left
  }
  return dy >= 0 ? 2 : 0; // bottom or top
}

function anchorForLine(start: { x: number; y: number }, end: { x: number; y: number }): Anchor {
  const sx = start.x + PADDING_PX;
  const sy = start.y + PADDING_PX;
  const ex = end.x + PADDING_PX;
  const ey = end.y + PADDING_PX;

  const minX = Math.min(sx, ex);
  const maxX = Math.max(sx, ex);
  const minY = Math.min(sy, ey);
  const maxY = Math.max(sy, ey);

  const fromCol = Math.floor(minX / PX_PER_COL);
  const fromRow = Math.floor(minY / PX_PER_ROW);
  const toCol = Math.floor(maxX / PX_PER_COL);
  const toRow = Math.floor(maxY / PX_PER_ROW);

  const fromColOff = Math.round((minX - fromCol * PX_PER_COL) * EMU_PER_PX);
  const fromRowOff = Math.round((minY - fromRow * PX_PER_ROW) * EMU_PER_PX);
  const toColOff = Math.round((maxX - toCol * PX_PER_COL) * EMU_PER_PX);
  const toRowOff = Math.round((maxY - toRow * PX_PER_ROW) * EMU_PER_PX);

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    fromCol,
    fromColOff,
    fromRow,
    fromRowOff,
    toCol,
    toColOff,
    toRow,
    toRowOff,
    cx: Math.round(width * EMU_PER_PX),
    cy: Math.round(height * EMU_PER_PX),
  };
}

function lineXml(
  id: number,
  name: string,
  waypoints: Array<{ x: number; y: number }>,
  fromShapeId?: number,
  toShapeId?: number,
): string {
  if (waypoints.length < 2) return '';
  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];
  const minX = Math.min(...waypoints.map(p => p.x));
  const minY = Math.min(...waypoints.map(p => p.y));
  const maxX = Math.max(...waypoints.map(p => p.x));
  const maxY = Math.max(...waypoints.map(p => p.y));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const anchor = toAnchor(minX, minY, width, height);

  const relPath = waypoints
    .map((p, idx) => {
      const x = Math.round((p.x - minX) * EMU_PER_PX);
      const y = Math.round((p.y - minY) * EMU_PER_PX);
      return idx === 0
        ? `<a:moveTo><a:pt x=\"${x}\" y=\"${y}\"/></a:moveTo>`
        : `<a:lnTo><a:pt x=\"${x}\" y=\"${y}\"/></a:lnTo>`;
    })
    .join('');

  const fromIdx = fromShapeId ? connectionIdx(start, end) : undefined;
  const toIdx = toShapeId ? connectionIdx(end, start) : undefined;

  return `<xdr:twoCellAnchor editAs=\"absolute\">
    <xdr:from><xdr:col>${anchor.fromCol}</xdr:col><xdr:colOff>${anchor.fromColOff}</xdr:colOff><xdr:row>${anchor.fromRow}</xdr:row><xdr:rowOff>${anchor.fromRowOff}</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>${anchor.toCol}</xdr:col><xdr:colOff>${anchor.toColOff}</xdr:colOff><xdr:row>${anchor.toRow}</xdr:row><xdr:rowOff>${anchor.toRowOff}</xdr:rowOff></xdr:to>
    <xdr:cxnSp>
      <xdr:nvCxnSpPr>
        <xdr:cNvPr id=\"${id}\" name=\"${name}\"/>
        <xdr:cNvCxnSpPr>${fromShapeId !== undefined ? `<a:stCxn id=\"${fromShapeId}\" idx=\"${fromIdx ?? 1}\"/>` : ''}${toShapeId !== undefined ? `<a:endCxn id=\"${toShapeId}\" idx=\"${toIdx ?? 3}\"/>` : ''}</xdr:cNvCxnSpPr>
      </xdr:nvCxnSpPr>
      <xdr:spPr>
        <a:xfrm><a:off x=\"0\" y=\"0\"/><a:ext cx=\"${anchor.cx}\" cy=\"${anchor.cy}\"/></a:xfrm>
        <a:custGeom>
          <a:avLst/>
          <a:gdLst/>
          <a:ahLst/>
          <a:cxnLst/>
          <a:rect l=\"0\" t=\"0\" r=\"0\" b=\"0\"/>
          <a:pathLst>
            <a:path w=\"${Math.max(1, Math.round(width * EMU_PER_PX))}\" h=\"${Math.max(1, Math.round(height * EMU_PER_PX))}\">${relPath}</a:path>
          </a:pathLst>
        </a:custGeom>
        <a:ln w=\"15240\">
          <a:solidFill><a:srgbClr val=\"111827\"/></a:solidFill>
          <a:tailEnd type=\"none\"/>
          <a:headEnd type=\"triangle\" w=\"lg\" len=\"lg\"/>
        </a:ln>
      </xdr:spPr>
    </xdr:cxnSp>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
}

function drawingXml(shapes: string[]): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<xdr:wsDr xmlns:xdr=\"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\">
  ${shapes.join('')}
</xdr:wsDr>`;
}

export async function exportBpmnToExcel({
  processTable,
  processes,
  swimlanes,
}: {
  processTable: ProcessTable;
  processes: Process[];
  swimlanes: Swimlane[];
}): Promise<Blob> {
  const layout = await layoutBpmnProcess(processes, swimlanes);

  const laneRows: Array<{ startRow: number; endRow: number; name: string }> = [];
  const laneLabelRows = new Map<string, number>();
  const lanePalette = ['E6EEF5', 'DDF6FA', 'FEF4E6', 'F2F6E8'];
  const laneFills: string[] = [];

  swimlanes.forEach((lane, idx) => {
    const pos = layout.lanes.get(lane.id);
    if (!pos) return;
    const startRow = Math.max(1, Math.floor((pos.y + PADDING_PX) / PX_PER_ROW) + 1);
    const span = Math.max(1, Math.ceil(pos.height / PX_PER_ROW));
    const endRow = startRow + span - 1;
    const midRow = Math.floor((startRow + endRow) / 2);
    laneRows.push({ startRow, endRow, name: lane.name });
    laneLabelRows.set(lane.name, midRow);

    const baseColor = clampColorHex(lane.color, lanePalette[idx % lanePalette.length]);
    laneFills.push(lighten(baseColor, 0.2));
  });

  const { xml: stylesXmlStr, laneStyleIds } = stylesXml(laneFills);
  const laneRowsWithStyle = laneRows.map((lane, idx) => ({ ...lane, styleId: laneStyleIds[idx] || 0 }));

  const shapes: string[] = [];
  let shapeId = 1;
  const shapeIdByProcess = new Map<string, number>();

  processes.forEach(p => {
    const node = layout.nodes.get(p.id);
    if (!node) return;
    const anchor = toAnchor(node.x, node.y, node.width, node.height);
    const sid = shapeId++;
    shapeIdByProcess.set(p.id, sid);
    shapes.push(shapeXml(sid, `Shape_${p.id}`, anchor, p.bpmnElement || 'task', p.name || ''));
  });

  layout.edges.forEach(edge => {
    if (edge.waypoints.length < 2) return;
    const match = /flow_(.+)_to_(.+)/.exec(edge.id);
    const sourceId = match?.[1];
    const targetId = match?.[2];
    const fromShapeId = sourceId ? shapeIdByProcess.get(sourceId) : undefined;
    const toShapeId = targetId ? shapeIdByProcess.get(targetId) : undefined;
    shapes.push(lineXml(shapeId++, edge.id, edge.waypoints, fromShapeId, toShapeId));
  });

  const totalWidthPx = layout.totalWidth + PADDING_PX * 2;
  const totalHeightPx = layout.totalHeight + PADDING_PX * 2;
  const numCols = Math.max(20, Math.ceil(totalWidthPx / PX_PER_COL) + 6); // extra cols for connectors to have space
  const numRows = Math.max(20, Math.ceil(totalHeightPx / PX_PER_ROW) + 6);

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypes());
  zip.folder('_rels')?.file('.rels', rootRels());

  const xl = zip.folder('xl');
  xl?.file('workbook.xml', workbookXml());
  xl?.folder('_rels')?.file('workbook.xml.rels', workbookRels());
  xl?.file('styles.xml', stylesXmlStr);
  xl?.folder('worksheets')?.file('sheet1.xml', sheetXml(numCols, numRows, laneRowsWithStyle, laneLabelRows));
  xl?.folder('worksheets')?.folder('_rels')?.file('sheet1.xml.rels', sheetRels());
  xl?.folder('drawings')?.file('drawing1.xml', drawingXml(shapes));

  zip.folder('docProps')?.file('core.xml', coreProps());
  zip.folder('docProps')?.file('app.xml', appProps());

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function downloadBpmnAsExcel({
  processTable,
  processes,
  swimlanes,
  filename,
}: {
  processTable: ProcessTable;
  processes: Process[];
  swimlanes: Swimlane[];
  filename?: string;
}): Promise<void> {
  const blob = await exportBpmnToExcel({ processTable, processes, swimlanes });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${processTable.name || 'process'}-bpmn.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

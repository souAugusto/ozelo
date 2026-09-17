import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * expo-print's web shim ignores the `html` you pass it and just calls
 * window.print() on the current page — so on web we open a dedicated window,
 * write the report into it, and print that instead. Native uses the real
 * HTML-to-PDF renderer and shares the resulting file.
 */
export async function exportReportAsPdf(html: string) {
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Não foi possível abrir a janela de impressão — verifique o bloqueador de pop-ups.');
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 350);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório Ozelo' });
  }
}

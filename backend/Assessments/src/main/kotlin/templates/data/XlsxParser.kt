package org.example.templates.data

import org.w3c.dom.Element
import java.io.InputStream
import java.util.zip.ZipInputStream
import javax.xml.parsers.DocumentBuilderFactory

object XlsxParser {

    fun parse(input: InputStream): List<Map<String, String>> {
        val entries = mutableMapOf<String, ByteArray>()
        ZipInputStream(input).use { zip ->
            generateSequence { zip.nextEntry }.forEach { entry ->
                entries[entry.name] = zip.readBytes()
            }
        }
        val sharedStrings = entries["xl/sharedStrings.xml"]?.let { parseSharedStrings(it) } ?: emptyList()
        val sheetBytes = entries["xl/worksheets/sheet1.xml"]
            ?: error("sheet1.xml not found in xlsx")
        return parseSheet(sheetBytes, sharedStrings)
    }

    private fun parseSharedStrings(bytes: ByteArray): List<String> {
        val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(bytes.inputStream())
        val siNodes = doc.getElementsByTagName("si")
        return (0 until siNodes.length).map { i ->
            val si = siNodes.item(i) as Element
            val tNodes = si.getElementsByTagName("t")
            (0 until tNodes.length).joinToString("") { j -> tNodes.item(j).textContent }
        }
    }

    private fun parseSheet(bytes: ByteArray, sharedStrings: List<String>): List<Map<String, String>> {
        val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(bytes.inputStream())
        val rowNodes = doc.getElementsByTagName("row")
        return (0 until rowNodes.length).mapNotNull { i ->
            val row = rowNodes.item(i) as Element
            val cells = row.getElementsByTagName("c")
            val map = mutableMapOf<String, String>()
            for (j in 0 until cells.length) {
                val cell = cells.item(j) as Element
                val ref = cell.getAttribute("r")
                val colLetter = ref.takeWhile { it.isLetter() }
                val type = cell.getAttribute("t")
                val vNode = cell.getElementsByTagName("v").item(0)
                if (vNode != null) {
                    val raw = vNode.textContent
                    map[colLetter] = if (type == "s") sharedStrings[raw.toInt()] else raw
                }
            }
            if (map.isEmpty()) null else map
        }
    }
}

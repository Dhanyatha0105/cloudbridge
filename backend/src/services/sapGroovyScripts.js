/**
 * SAP CPI Groovy Transformation Scripts
 * Reference implementations — in production these run as Groovy scripts inside SAP CPI iFlows.
 * Kept here for local testing and iFlow scaffolding.
 */

// Groovy equivalent: workload status → SAP Plant Maintenance notification
const workloadToSAPMaintenanceGroovy = `
import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.xml.MarkupBuilder

def Message processData(Message message) {
    def body = message.getBody(String)
    def json = new JsonSlurper().parseText(body)

    def writer = new StringWriter()
    def xml = new MarkupBuilder(writer)

    xml.MaintenanceNotification {
        ExternalWorkloadId(json.id)
        NotificationType("M2")  // Malfunction report
        ShortDescription("Migration status: ${json.status}")
        Priority(json.riskLevel == "high" ? "1" : json.riskLevel == "medium" ? "2" : "3")
        FunctionalLocation(json.environment?.toUpperCase() ?: "CLOUD")
        ReportedBy("CLOUDBRIDGE-AUTO")
        ReportedDate(new Date().format("yyyyMMdd"))
        CarbonRelevant("X")
        CO2KgPerMonth(json.carbonKgCO2ePerMonth)
    }

    message.setBody(writer.toString())
    message.setHeader("Content-Type", "application/xml")
    message.setHeader("X-Transformed-By", "CloudBridge-CPI-v1.0")
    return message
}
`;

// Groovy equivalent: carbon telemetry → SAP Analytics Cloud
const carbonToAnalyticsGroovy = `
import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

def Message processData(Message message) {
    def body = message.getBody(String)
    def json = new JsonSlurper().parseText(body)

    // D+ Decarbonization Plus transformation
    def sacPayload = [
        reportId: UUID.randomUUID().toString(),
        timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
        measures: [
            totalCO2eKgHour: json.currentKgCO2ePerHour,
            baselineCO2eKgHour: json.baselineKgCO2ePerHour,
            reductionPercent: json.reductionPercent,
            netZeroTrajectoryOnTrack: json.reductionPercent >= 15.0
        ],
        dimensions: [
            tenant: message.getHeader("X-Tenant-ID"),
            dataResidency: "EU",
            reportType: "D_PLUS_CARBON_TELEMETRY",
            atosGenesisPlan: true
        ]
    ]

    message.setBody(JsonOutput.toJson(sacPayload))
    return message
}
`;

// XSLT transformation for inventory SFTP → SAP ERP
const inventoryXSLT = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/InventoryExport">
    <MATMAS05>
      <IDOC BEGIN="1">
        <EDI_DC40 SEGMENT="1">
          <TABNAM>EDI_DC40</TABNAM>
          <DIRECT>2</DIRECT>
          <IDOCTYP>MATMAS05</IDOCTYP>
          <MESTYP>MATMAS</MESTYP>
          <RCVPRT>LS</RCVPRT>
          <RCVPRN>CLOUDBRIDGE_SAP</RCVPRN>
        </EDI_DC40>
        <xsl:for-each select="Item">
          <E1MARAM SEGMENT="1">
            <MATNR><xsl:value-of select="ItemId"/></MATNR>
            <MAKTX><xsl:value-of select="Description"/></MAKTX>
            <MEINS><xsl:value-of select="UnitOfMeasure"/></MEINS>
            <MSTAE>10</MSTAE>
            <!-- D+ sustainability flag for remanufactured devices -->
            <XSL_REMANUF>
              <xsl:if test="IsRemanufactured = 'true'">X</xsl:if>
            </XSL_REMANUF>
          </E1MARAM>
        </xsl:for-each>
      </IDOC>
    </MATMAS05>
  </xsl:template>
</xsl:stylesheet>`;

const transformWorkloadToSAPXML = (workload) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<MaintenanceNotification xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ExternalWorkloadId>${workload.id || 'unknown'}</ExternalWorkloadId>
  <NotificationType>M2</NotificationType>
  <ShortDescription>CloudBridge Migration: ${workload.name} - ${workload.status}</ShortDescription>
  <Priority>${workload.riskLevel === 'high' ? '1' : '2'}</Priority>
  <FunctionalLocation>${(workload.environment || 'CLOUD').toUpperCase()}</FunctionalLocation>
  <ReportedBy>CLOUDBRIDGE-AUTO</ReportedBy>
  <ReportedDate>${new Date().toISOString().split('T')[0].replace(/-/g, '')}</ReportedDate>
  <DPlusCompliant>true</DPlusCompliant>
  <CO2KgPerMonth>${workload.carbonKgCO2ePerMonth || 0}</CO2KgPerMonth>
  <MigrationPhase>${workload.migrationPhase || 1}</MigrationPhase>
</MaintenanceNotification>`;
};

module.exports = {
  workloadToSAPMaintenanceGroovy,
  carbonToAnalyticsGroovy,
  inventoryXSLT,
  transformWorkloadToSAPXML,
};

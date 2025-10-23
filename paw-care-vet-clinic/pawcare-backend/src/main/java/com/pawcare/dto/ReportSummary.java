package com.pawcare.dto;

import com.pawcare.entity.OperationLog;
import java.util.ArrayList;
import java.util.List;

public class ReportSummary {
    public String period;
    public String from;
    public String to;
    public int appointmentsDone;
    public int prescriptionsDispensed;
    public int petsAdded;
    public List<OperationLog> events = new ArrayList<>();
}


package com.pawcare.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "operation_logs")
public class OperationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "timestamp")
    private LocalDateTime ts;

    @Column(name = "operation_type")
    private String type; // PET_CREATED, APPT_CREATED, APPT_APPROVED, APPT_DONE, RX_CREATED, RX_DISPENSED

    private String message;
    
    @Column(name = "pet_id")
    private Long petId;

    // Constructors
    public OperationLog() {}

    public OperationLog(LocalDateTime ts, String type, String message, Long petId) {
        this.ts = ts;
        this.type = type;
        this.message = message;
        this.petId = petId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getTs() { return ts; }
    public void setTs(LocalDateTime ts) { this.ts = ts; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }
}


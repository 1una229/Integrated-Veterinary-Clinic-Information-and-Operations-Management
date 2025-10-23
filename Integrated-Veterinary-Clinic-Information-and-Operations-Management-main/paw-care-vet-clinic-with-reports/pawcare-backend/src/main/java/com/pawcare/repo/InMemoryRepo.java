package com.pawcare.repo;

import com.pawcare.model.Models.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Repository
public class InMemoryRepo {

    private final Map<Long, Pet> pets = new ConcurrentHashMap<>();
    private final Map<Long, Appointment> appts = new ConcurrentHashMap<>();
    private final Map<Long, Prescription> rx = new ConcurrentHashMap<>();
    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final Map<Long, OperationLog> ops = new ConcurrentHashMap<>();

    private final AtomicLong petSeq = new AtomicLong(0);
    private final AtomicLong apptSeq = new AtomicLong(0);
    private final AtomicLong rxSeq = new AtomicLong(0);
    private final AtomicLong userSeq = new AtomicLong(0);
    private final AtomicLong opSeq = new AtomicLong(0);

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public InMemoryRepo() {
        // Seed sample data
        Pet p1 = new Pet();
        p1.id = nextPetId(); p1.name="Choco"; p1.species="Canine"; p1.breed="Beagle";
        p1.gender="Female"; p1.age=3; p1.microchip="1234-5678";
        p1.owner="Maria Santos"; p1.address="123 Mabini St."; p1.federation="N/A";
        pets.put(p1.id, p1);
        log("PET_CREATED", "Added pet Choco", p1.id);

        Pet p2 = new Pet();
        p2.id = nextPetId(); p2.name="Mimi"; p2.species="Feline"; p2.breed="Persian";
        p2.gender="Male"; p2.age=2; p2.microchip="2233-4455";
        p2.owner="John Dela Cruz"; p2.address="45 Narra St."; p2.federation="FCCI";
        pets.put(p2.id, p2);
        log("PET_CREATED", "Added pet Mimi", p2.id);

        Appointment a1 = new Appointment();
        a1.id = nextApptId(); a1.petId = p1.id; a1.owner = p1.owner;
        a1.date = LocalDate.now().plusDays(2).toString(); a1.time="10:00"; a1.vet="Dr. Cruz"; a1.status="Pending";
        appts.put(a1.id, a1);
        log("APPT_CREATED", "Appointment created for " + p1.owner + " (Choco)", p1.id);

        Prescription r1 = new Prescription();
        r1.id = nextRxId(); r1.petId=p1.id; r1.pet=p1.name; r1.owner=p1.owner;
        r1.drug="Amoxicillin"; r1.dosage="250 mg"; r1.directions="Twice daily";
        r1.prescriber="Dr. Cruz"; r1.date=LocalDate.now().toString(); r1.dispensed=false;
        rx.put(r1.id, r1);
        log("RX_CREATED", "Rx issued for Choco (Amoxicillin)", p1.id);

        users.put(nextUserId(), user("Admin","admin"));
        users.put(nextUserId(), user("Dr. Cruz","vet"));
        users.put(nextUserId(), user("Daisy","receptionist"));
        users.put(nextUserId(), user("Paul","pharmacist"));
    }

    private User user(String name, String role){ User u = new User(); u.id = userSeq.get(); u.name = name; u.role = role; return u; }

    private long nextPetId(){ return petSeq.incrementAndGet(); }
    private long nextApptId(){ return apptSeq.incrementAndGet(); }
    private long nextRxId(){ return rxSeq.incrementAndGet(); }
    private long nextUserId(){ return userSeq.incrementAndGet(); }
    private long nextOpId(){ return opSeq.incrementAndGet(); }

    private void log(String type, String message, Long petId){
        OperationLog op = new OperationLog();
        op.id = nextOpId();
        op.ts = LocalDateTime.now().format(TS);
        op.type = type;
        op.message = message;
        op.petId = petId;
        ops.put(op.id, op);
    }

    // Pets
    public List<Pet> pets(){ return pets.values().stream().sorted(Comparator.comparing(p->p.id)).toList(); }
    public Optional<Pet> pet(long id){ return Optional.ofNullable(pets.get(id)); }
    public Pet addPet(Pet p){ p.id = nextPetId(); pets.put(p.id,p); log("PET_CREATED","Added pet " + p.name, p.id); return p; }
    public Pet updatePet(long id, Pet p){ p.id=id; pets.put(id,p); log("PET_UPDATED","Updated pet " + p.name, p.id); return p; }
    public void removePet(long id){ Pet p = pets.remove(id); log("PET_DELETED","Deleted pet " + (p!=null?p.name:("#"+id)), id); }

    // Appointments
    public List<Appointment> appts(){ return appts.values().stream().sorted(Comparator.comparing(a->a.id)).toList(); }
    public Appointment addAppt(Appointment a){ a.id=nextApptId(); a.status="Pending"; appts.put(a.id,a); log("APPT_CREATED","Appointment created for " + a.owner, a.petId); return a; }
    public Optional<Appointment> appt(long id){ return Optional.ofNullable(appts.get(id)); }
    public void approveAppt(long id){ Appointment a=appt(id).orElse(null); if(a!=null){ a.status="Approved by Vet"; log("APPT_APPROVED","Appointment approved for " + a.owner, a.petId); } }
    public void doneAppt(long id){ Appointment a=appt(id).orElse(null); if(a!=null){ a.status="Done"; a.completedAt = LocalDate.now().toString(); log("APPT_DONE","Appointment done for " + a.owner, a.petId); } }
    public void removeAppt(long id){ Appointment a = appts.remove(id); log("APPT_DELETED","Removed appointment #" + id, a!=null?a.petId:null); }

    // Prescriptions
    public List<Prescription> rx(){ return rx.values().stream().sorted(Comparator.comparing(r->r.id)).toList(); }
    public Prescription addRx(Prescription r){ r.id=nextRxId(); rx.put(r.id,r); log("RX_CREATED","Rx issued for " + r.pet + " (" + r.drug + ")", r.petId); return r; }
    public Optional<Prescription> getRx(long id){ return Optional.ofNullable(rx.get(id)); }
    public void dispense(long id){ Prescription r = rx.get(id); if(r!=null){ r.dispensed=true; r.dispensedAt = LocalDate.now().toString(); log("RX_DISPENSED","Rx dispensed for " + r.pet, r.petId); } }

    // Users
    public List<User> users(){ return users.values().stream().sorted(Comparator.comparing(u->u.id)).toList(); }
    public User addUser(User u){ u.id = nextUserId(); users.put(u.id,u); return u; }
    public void removeUser(long id){ users.remove(id); }

    // Ops & Reports
    public List<OperationLog> opsBetween(LocalDate from, LocalDate to){
        return ops.values().stream()
                .filter(o->{
                    LocalDate d = LocalDate.parse(o.ts.substring(0,10));
                    return (!d.isBefore(from)) && (!d.isAfter(to));
                })
                .sorted(Comparator.comparing(o->o.id))
                .collect(Collectors.toList());
    }
}

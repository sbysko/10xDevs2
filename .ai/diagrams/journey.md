stateDiagram-v2

    [*] --> LandingPage
    
    state "Strefa Publiczna" as Publiczna {
        LandingPage: Strona informacyjna
        LandingPage --> Rejestracja: Przycisk "Rozpocznij naukę"
        LandingPage --> Logowanie: Przycisk "Zaloguj się"
        
        state Rejestracja {
            [*] --> FormularzRejestracji
            FormularzRejestracji --> WalidacjaReg: Wysłanie danych
            state if_reg_valid <<choice>>
            WalidacjaReg --> if_reg_valid
            if_reg_valid --> Onboarding: Dane OK [Utworzono konto]
            if_reg_valid --> FormularzRejestracji: Błąd (np. email zajęty)
        }
        
        state Logowanie {
            [*] --> FormularzLogowania
            FormularzLogowania --> WalidacjaLog: Weryfikacja Supabase
            FormularzLogowania --> OdzyskiwanieHasla: "Zapomniałem hasła"
            
            state if_log_valid <<choice>>
            WalidacjaLog --> if_log_valid
            if_log_valid --> SprawdzenieProfili: Sukces
            if_log_valid --> FormularzLogowania: Błędne dane
        }
        
        state OdzyskiwanieHasla {
            [*] --> PodajEmail
            PodajEmail --> WyslanieLinku: Submit
            WyslanieLinku --> Logowanie: Powrót po zmianie hasła
        }
    }

    state "Proces Inicjalizacji" as Inicjalizacja {
        state SprawdzenieProfili <<choice>>
        
        SprawdzenieProfili --> Onboarding: Brak profili w bazie
        SprawdzenieProfili --> WyborProfilu: Istnieją profile
        
        state Onboarding {
            [*] --> DaneDziecka: Podaj imię i wybierz avatar
            DaneDziecka --> ZapiszProfil: Kliknięcie "Utwórz"
            ZapiszProfil --> Dashboard: Profil ustawiony jako aktywny
        }
        
        state WyborProfilu {
            [*] --> ListaDzieci: Wyświetl karty (avatar + imię)
            ListaDzieci --> Dashboard: Wybór dziecka [Cookie ustawione]
        }
    }

    state "Strefa Aplikacji (Zalogowany)" as App {
        Dashboard: Wybór kategorii (Zwierzęta, Owoce itd.)
        Dashboard --> Gra: Start sesji (10 pytań)
        
        state "Zarządzanie" as Zarzadzanie {
            Dashboard --> WyborProfilu: Przycisk "Zmień profil"
            Dashboard --> DodajProfil: Menu "Zarządzaj profilami"
            DodajProfil --> WyborProfilu: Po dodaniu dziecka
        }
    }

    App --> Logowanie: Wyloguj [Czyszczenie sesji i cookie]
    
    note left of SprawdzenieProfili
        Middleware sprawdza session 
        oraz rekordy w public.profiles
    end note

    note right of WyborProfilu
        Ustawia cookie 
        app_active_profile_id
    end note
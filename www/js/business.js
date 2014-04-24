String.prototype.format = function (args) {
    var newStr = this;
    for (var key in args) {
        newStr = newStr.replace('{' + key + '}', args[key]);
    }
    return newStr;
}

var Serie = function (item) {
    this.title = item.title;
    this.longDescription = item.longDescription;
    this.posterURL = item.posterURL;

    this.getPoster = function () {
        setTimeout(function () { return this.posterURL; }, 500);
    }
};

var everstreamViewModel = null;
var EverStreamViewModel = function () {
    var self = this;

    //==============================================
    // GESTIONNAIRE DE PAGE
    //----------------------------------------------
    // type de la page en cours d'affichage :
    // top detail searchresult ...
    this.pageType = ko.observable('top');

    this.pageStack = ko.observableArray();

    this.currentPage = ko.computed(function () {
        return self.pageStack().slice(0)[0];
    }, this);
    this.pageStack.unshift('top'); // .push('top');
    //-----------------------------------------------
    // FIN
    //==============================================
	

    // liste top
    this.topserie = ko.observableArray([]);

    // liste série chargées pendant la session
    this.series = ko.observableArray([]);

    // série en cours
    this.serie = ko.observable({ title: 'sample', longDescription: 'sample description', posterURL: '' });

    // liste des épisodes de la série en cours
    this.episodes = ko.observableArray([]);

    // liste des saisons
    this.seasons = ko.observableArray([]);

    this.currentSerie = ko.observable({
        nbVF: 0,
        nbVOSTFR: 11,
        nbVO: 5,
        seasons: []
    });

    this.currentLanguage = ko.observable( 'VF' );

    // Gestion de la saison sélectionnée :
    // modification de la sélection ==> recalculer la liste des épisodes
    this.currentSelectedSeason = ko.observable( '-' );
    this.currentSelectedSeason.subscribe( function( season ) {
        self.filterEpisodes( season );
    });

    /**
    this.currentSeason = ko.observable( '?' );
    this.currentEpisode = ko.observable( '?' );
    this.currentSelection = ko.computed( function() {
        return {
            language: self.currentLanguage(),
            season: self.currentSeason(),
            episode: self.currentEpisode()
        }
    }, this);
    **/

    this.currentSerieSeasons = ko.observableArray([]);

    this.currentSeasonEpisodes = ko.observableArray([]);
    this.currentSeasonEpisodesIdx = ko.observable(-1);

    this.currentSerieHistory = ko.observable({season: '-'});

    this.currentSerieHistoryDisplayEpisode = ko.computed( function() {
        return self.currentSerieHistory().season == "-"
            ? "Vous n'avez aucun épisode en cours pour cette série !"
            : self.currentSerieHistory().season + " - " + self.currentSerieHistory().episode;
    }, this );
    this.currentSerieHistoryShowPlayButton = ko.computed( function() {
        return self.currentSerieHistory().season == "-"
            ? false
            : true;
    });



    this.currentSerieHistory.subscribe( function( selected )
    {
        if( selected.season != '-' )
            self.currentSelectedSeason( selected.season );
        // self.filterEpisodes( selected.season );
        if( typeof(selected.episode) != 'undefined' && selected.episode != null && selected.episode != '-'  )
        {
            if( selected.episode.indexOf( '[VF]' ) != -1 )
                self.onLanguageClick( 'VF' );
            else if( selected.episode.indexOf( '[VOSTFR]' ) != -1 )
                self.onLanguageClick( 'VOSTFR' );
            else if( selected.episode.indexOf( '[VO]' ) != -1 )
                self.onLanguageClick( 'VO' );

            var match = ko.utils.arrayFirst(self.currentSeasonEpisodes(), function (item) { return item.title == selected.episode; });
            if( match )
                self.currentSeasonEpisodesIdx( self.currentSeasonEpisodes.indexOf( match ) );

            if( typeof(selected.duration) != 'undefined' && selected.duration != null && selected.duration != 0 )
            {
                var duration = selected.duration;
                var current = selected.current_position;
                var percent = current * 100 / duration;
                var txt = Math.round( percent )   + '%';
                var mins = Math.floor( current / 60 );
                var secs = current - (mins*60);
                var t = mins + ":" + Math.round( secs );
                $('#pb-video-progress').css( 'width', txt );
                $('#video-progress').text( t );
            }
            else
            {
                $('#pb-video-progress').css( 'width', "0%" );
                $('#video-progress').text( "00:00" );
            }
        } else
        {
            $('#pb-video-progress').css( 'width', "0%" );
            $('#video-progress').text( "00:00" );
        }
    });

    this.filterEpisodes = function( season )
    {
        var counters = {
            nbVF: 0,
            nbVOSTFR: 0,
            nbVO: 0,
            seasons: []
        };
        // extraire la liste des épisodes disponibles pour cette saison
        self.currentSeasonEpisodesIdx(-1);
        self.currentSeasonEpisodes([]);
        var language = '[' + self.currentLanguage() + ']';
        $.each( self.episodes(), function( index, item ) {
            if( item.season == season )
            {
                // si l'épisode est dans la langue choisie
                if( item.title.indexOf( language ) != -1 )
                    self.currentSeasonEpisodes.push( item );

                // Mise à jour des compteurs (épisodes dispos par langue)
                if( item.title.indexOf( '[VF]' ) != -1 )
                    counters.nbVF++;
                else if( item.title.indexOf( '[VOSTFR]' ) != -1 )
                    counters.nbVOSTFR++;
                else if( item.title.indexOf( '[VO]' ) != -1 )
                    counters.nbVO++;
            }
        });
        if( self.currentSeasonEpisodes().length > 0 )
            self.currentSeasonEpisodesIdx(0);
        this.currentSerie( counters );
    };

    // chargement de la liste des top séries
    // depuis le serveur ou depuis le localstorage
    this.loadTopSeries = function () {
        //alert('load top');
        var key = "topseries";
        //localStorage.removeItem(key);
        var item = localStorage.getItem(key);
        if (item == null) {
			$.ajax(
			{
				dataType: "json",
				url: topserieUrl,
				success: function (datas) {
					localStorage.setItem(key, JSON.stringify(datas));
					self.topserie(datas.TopSeries);
					self.series(datas.Series);
				},
				error: function() {
					// TODO - Traitement des erreurs serveur
					alert( "loadTopSeries error" );
				}
			});
			/***********
            $.getJSON(topserieUrl, function (datas) {
                // alert('top loaded');
                localStorage.setItem(key, JSON.stringify(datas));
                self.topserie(datas.TopSeries);
                self.series(datas.Series);
            });
			*******/
        }
        else {
            // alert('top in cache');
            var datas = JSON.parse(item);
            self.topserie(datas.TopSeries);
            self.series(datas.Series);
        }
    };

    //--------------------------------------------------
    // Chargement de la liste des épisodes d'une série
    //--------------------------------------------------
    this.loadEpisodeList = function ( serie ) {

        var key = "episodes_" + serie.serieId;
        //this.clearCache( key );
        var item = this.getCache(key);
        if (item == null) {
            $.getJSON(getEpisodesURL.format({ id: serie.serieId }), function (result) {
                self.storeCache( key, result );
                self.setEpisodeList( result );
                self.initSeasons( serie );
            });
        }
        else
        {
            self.setEpisodeList( item );
            self.initSeasons( serie );
        }


    };

    this.setEpisodeList = function( value )
    {
        $.each(value.Episodes, function (index, item) {

            if ($.inArray(item.season, self.currentSerieSeasons()) == -1) {
                console.log('season:' + item.season);
                self.currentSerieSeasons.push(item.season);
            }
        });
        self.episodes(value.Episodes);
    };

    //-------------------------------------------------
    // Initialisation des saisons de la série en cours
    // (lors de la sélection de la série)
    //-------------------------------------------------
    this.initSeasons = function( serie )
    {
        console.log( "initSeasons" );
        everstreamDAL.getHistory( serie.serieId, function( history ) {
            if( history == null )
            {
                console.log( "pas d'historique" );
                history = {
                    season: '-' // self.currentSerieSeasons()[0]
                };
                self.currentSelectedSeason(self.currentSerieSeasons()[0] );
            }
            self.currentSerieHistory( history );
        } );
    };

    //==================================================
    // SELECTEUR D'EPISODE
    //--------------------------------------------------

    //-------------------------------
    // Sélection de l'épisode suivant
    //-------------------------------
    this.episodeNext = function(data,e)
    {
        if( self.currentSeasonEpisodesIdx()  < self.currentSeasonEpisodes().length-1 )
            self.currentSeasonEpisodesIdx( self.currentSeasonEpisodesIdx()+1 );
        e.stopPropagation();
    };

    //----------------------------------
    // Sélection de l'épisode précédent
    //----------------------------------
    this.episodePrev = function(data,e)
    {
        if( self.currentSeasonEpisodesIdx() > 0 )
            self.currentSeasonEpisodesIdx( self.currentSeasonEpisodesIdx()-1 );
        e.stopPropagation();
    };

    //----------------------------------
    // Sélection de la saison suivante
    //----------------------------------
	this.seasonNext = function(data,e)
	{
		var idx = self.currentSerieSeasons.indexOf( self.currentSelectedSeason() );
		if( idx >= 0 && idx < self.currentSerieSeasons().length-1 )
		{
			idx++;
			self.currentSelectedSeason( self.currentSerieSeasons()[idx] );
		}
		e.stopPropagation();
	}
    //------------------------------------
    // Sélection de la saison précédente
    //------------------------------------
    this.seasonPrev = function(data,e)
    {
        var idx = self.currentSerieSeasons.indexOf( self.currentSelectedSeason() );
        if( idx > 0 )
        {
            idx--;
            self.currentSelectedSeason(self.currentSerieSeasons()[idx]);
        }
		e.stopPropagation();
    };

    //--------------------------------------------------
    // FIN - SELECTEUR D'EPISODE
    //==================================================

    //==================================================
    // RECHERCHE / CHARGEMENT VIDEO
    //--------------------------------------------------
    this.startVideo = function() {
        var episode = self.currentSeasonEpisodes()[self.currentSeasonEpisodesIdx()];
        self.startEpisode(episode);
    };

    this.startEpisode = function( episode )
    {
        $('#dialog_title').text("Recherche de votre vidéo");
        $('#dialog_subtitle').text( episode.season + " " + episode.title);
        $('#modal_progress').text("recherche des liens");
        $('#modal_message').text("...");
        //startProgress();
        $('#myModal').modal('show');

        var real = true;

        if( real ) {
            $.getJSON(getStreamsURL.format({ id: episode.serieId, season: episode.season, episode: episode.title }), function (result) {
                if (result == null || result.Streams == null || result.Streams.length == 0) {
                    $('#alert-popup-message').text("Aucune vidéo n'est disponible pour le moment !");
                    $('#alert-popup-message-secondary').text("Veuillez réessayer plus tard.");

                    $('#myModal').modal('hide');
                    $('#alert-popup').modal('show');
                }
                else {
                    searchVideo(episode, result.Streams, 0, function () {
                        $('#myModal').modal('hide');
                        stopProgress();
                        everstreamDAL.updateHistory( episode, new Date().getTime(), 0, 0 );
                    }, function () {
                        $('#myModal').modal('hide');
                        stopProgress();
                    });
                    //scrapUrl(result.Streams[0].playerUrl);
                }
            });
        }
        else {

            var video = document.getElementById('video'); // 'video2');
            video.setAttribute('src', 'http://vs3.exashare.com:8777/nsx2iu7c74m4kplwt3x6lbfx5xmdrh2k7j4uefqx7xyvwa6wx3a3vbbfuboq/v.mp4');
            video.load();
            video.play();
        }
    };
    //--------------------------------------------------
    // FIN - RECHERCHE / CHARGEMENT VIDEO
    //==================================================

    //==================================================
    // GESTION DE L'HISTORIQUE
    //--------------------------------------------------
    this.addHistory = function( episode )
    {
        var item = {
            episode: episode,

        }
    };
    //--------------------------------------------------
    // FIN - GESTION DE L'HISTORIQUE
    //==================================================


    this.loadStreams = function (episode) {

    };

    this.onSerieClick = function (target) {
        // rechercher si la série est déja chargée en mémoire
        var match = ko.utils.arrayFirst(self.series(), function (item) { return item.id == target.serieId; });
        if (match) {
            // alert("found :" + match.title);
            self.currentSerieHistory({season: '?'});
            self.currentSelectedSeason('?');
            self.currentSerieSeasons([]);
            self.episodes([]);

            self.loadEpisodeList(target);
            self.serie(match);
            self.pageStack.unshift('serie');
        }
    };

    this.onLanguageClick = function( newLanguage )
    {
        self.currentLanguage( newLanguage );
        self.filterEpisodes( self.currentSelectedSeason() );
    }

    // fonctions de navigation
    this.prevPage = function () {
        self.pageStack.shift(); //  ('top');
    };

    this.loadTopSeries();
    //alert( this.pageStack()[0] );

    //=======================
    // PROGRESS BAR BINDINGS
    //=======================
    this.progressMax = ko.observable(100);
    this.progressCurrent = ko.observable(70);


    //=======================
    // GESTION DU CACHE
    //=======================
    this.getCache = function( key )
    {
        var item = localStorage.getItem( key );
        if( item == null )
            return null;
        return JSON.parse(item)
    };
    this.storeCache = function( key, value )
    {
        localStorage.setItem( key, JSON.stringify(value) );
    };
    this.clearCache = function( key )
    {
        localStorage.removeItem( key );
    };

};

var test = {

    seasons: [
        { name: 'Saison 1', language: [
            {name:'VF', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]},
            {name:'VOSTFR', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]},
            {name:'VO', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]}
        ]},
        { name: 'Saison 2', language: [
            {name:'VF', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]},
            {name:'VOSTFR', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]},
            {name:'VO', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]}
        ]},
        { name: 'Saison 3', language: [
            {name:'VF', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]},
            {name:'VOSTFR', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]},
            {name:'VO', episodes: [
                {title: 'Ep 01'},
                {title: 'Ep 02'},
                {title: 'Ep 03'},
                {title: 'Ep 04'},
            ]}
        ]}
    ]

};

//var viewModel = new EverStreamViewModel();
//ko.applyBindings(viewModel);